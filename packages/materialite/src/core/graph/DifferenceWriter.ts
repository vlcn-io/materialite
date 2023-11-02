import { Source } from "../../sources/Source.js";
import { Multiset } from "../multiset.js";
import { DestroyOptions, Version } from "../types.js";
import {
  DifferenceStreamReader,
  DifferenceStreamReaderFromRoot,
} from "./DifferenceReader.js";
import { Msg } from "./Msg.js";
import { IOperator } from "./ops/Operator.js";

/**
 * Write handle
 */
abstract class AbstractDifferenceStreamWriter<T> {
  protected lastVersionSent: Version = -1;
  readonly queues: [Version, Multiset<T>][][] = [];
  readonly readers: DifferenceStreamReader<T>[] = [];
  protected operator: IOperator | null = null;

  setOperator(operator: IOperator) {
    if (this.operator != null) {
      throw new Error("Operator already set!");
    }
    this.operator = operator;
  }

  // prepares data but does not yet send it to readers
  queueData(data: [Version, Multiset<T>]) {
    for (const q of this.queues) {
      q.push(data);
    }
  }

  // queues data and notifies readers
  sendData(version: Version, data: Multiset<T>) {
    if (version <= this.lastVersionSent) {
      // If this is an old version we'll ignore it.
      // The rationale here is that when views are attached later which request
      // a re-pull, we don't want to re-process every single fork of the stream.
      // Just the sections of the stream on the path
      // to the new view.
      // TODO: Test our join and reduce (or any stateful operator) that is correctly
      // handles re-computation without requiring `-1` z-set entries to be sent.
      // TODO `pull` needs to update writer.
      // Should we do this in writer or reader?
      // Writer so we never even queue.
      return;
    }
    // TODO: check the queues. Maybe they should not receive this data
    // because they are on a fork that didn't pull it.
    this.queueData([version, data]);
    this.notify(version);
  }

  pull(msg: Msg) {
    if (msg._tag != "pull") {
      return;
    }
    this.lastVersionSent = -1;
    this.operator?.pull(msg);
  }

  notify(version: Version) {
    for (const r of this.readers) {
      r.notify(version);
    }
  }

  newReader(): DifferenceStreamReader<T> {
    const queue: [Version, Multiset<T>][] = [];
    this.queues.push(queue);
    const reader = new DifferenceStreamReader(this, queue);
    this.readers.push(reader);
    return reader;
  }

  removeReader(
    reader: DifferenceStreamReader<T>,
    options: DestroyOptions = { autoCleanup: true }
  ) {
    const idx = this.readers.indexOf(reader);
    if (idx !== -1) {
      this.readers.splice(idx, 1);
      this.queues.splice(idx, 1);
    }
    if (this.readers.length === 0 && options.autoCleanup === true) {
      // no more readers?
      // then we can destroy the operator
      this.destroy();
    }
  }

  destroy() {
    this.readers.length = 0;
    this.operator?.destroy();
  }
}

export class DifferenceStreamWriter<
  T
> extends AbstractDifferenceStreamWriter<T> {}

export class RootDifferenceStreamWriter<
  T
> extends AbstractDifferenceStreamWriter<T> {
  readonly #source;
  constructor(source: Source<unknown, unknown>) {
    super();
    this.#source = source;
  }

  pull(msg: Msg) {
    super.pull(msg);
    if (this.#source._state === "stateful") {
      this.#source.resendAll(msg);
    }
  }

  newReader() {
    const queue: [Version, Multiset<T>][] = [];
    this.queues.push(queue);
    const reader: DifferenceStreamReader<T> =
      new DifferenceStreamReaderFromRoot(this, queue);
    this.readers.push(reader);
    return reader;
  }
}
