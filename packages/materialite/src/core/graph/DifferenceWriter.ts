import { Source } from "../../sources/Source.js";
import { Multiset } from "../multiset.js";
import { DestroyOptions, Version } from "../types.js";
import {
  DifferenceStreamReader,
  DifferenceStreamReaderFromRoot,
} from "./DifferenceReader.js";
import { Hoisted } from "./Msg.js";
import { Queue } from "./Queue.js";
import { IOperator } from "./ops/Operator.js";

/**
 * Write handle
 */
abstract class AbstractDifferenceStreamWriter<T> {
  readonly queues: Queue<T>[] = [];
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
      q.enqueue(data);
    }
  }

  // queues data and notifies readers
  sendData(version: Version, data: Multiset<T>) {
    this.queueData([version, data]);
    this.notify(version);
  }

  pull(msg: Hoisted) {
    this.operator?.pull(msg);
  }

  notify(version: Version) {
    for (const r of this.readers) {
      r.notify(version);
    }
  }

  notifyCommitted(v: Version) {
    for (const r of this.readers) {
      r.notifyCommitted(v);
    }
  }

  newReader(): DifferenceStreamReader<T> {
    const queue = new Queue<T>();
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
    this.#maybeCleanup(options.autoCleanup || false);
  }

  #maybeCleanup(autoCleanup: boolean, isNextTick = false) {
    if (autoCleanup && !isNextTick) {
      setTimeout(() => {
        this.#maybeCleanup(autoCleanup, true);
      }, 0);
      return;
    }

    if (autoCleanup && this.readers.length === 0) {
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

  pull(msg: Hoisted) {
    super.pull(msg);
    if (this.#source._state === "stateful") {
      this.#source.resendAll(msg);
    }
  }

  newReader() {
    const queue = new Queue<T>();
    this.queues.push(queue);
    const reader: DifferenceStreamReader<T> =
      new DifferenceStreamReaderFromRoot(this, queue);
    this.readers.push(reader);
    return reader;
  }
}
