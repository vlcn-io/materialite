import { Multiset } from "../multiset.js";
import { Version } from "../types.js";
import {
  DifferenceStreamReader,
  DifferenceStreamRederFromRoot,
} from "./DifferenceReader.js";
import { Msg } from "./Msg.js";

/**
 * Write handle
 */
export class DifferenceStreamWriter<T> {
  #lastVersionSent: Version = -1;
  readonly queues: [Version, Multiset<T>][][] = [];
  readonly readers: DifferenceStreamReader<T>[] = [];

  // prepares data but does not yet send it to readers
  queueData(data: [Version, Multiset<T>]) {
    for (const q of this.queues) {
      q.push(data);
    }
  }

  // queues data and notifies readers
  sendData(version: Version, data: Multiset<T>) {
    if (version <= this.#lastVersionSent) {
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
    this.queueData([version, data]);
    this.notify(version);
  }

  handlePullMsg(msg: Msg) {
    if (msg._tag != "pull") {
      return;
    }
    this.#lastVersionSent = -1;
  }

  notify(version: Version) {
    for (const r of this.readers) {
      r.notify(version);
    }
  }

  newReader() {
    const queue: [Version, Multiset<T>][] = [];
    this.queues.push(queue);
    const reader = new DifferenceStreamReader(queue);
    this.readers.push(reader);
    return reader;
  }

  removeReader(reader: DifferenceStreamReader<T>) {
    const idx = this.readers.indexOf(reader);
    if (idx !== -1) {
      this.readers.splice(idx, 1);
      this.queues.splice(idx, 1);
    }
  }
}

export class RootDifferenceStreamWriter<T> extends DifferenceStreamWriter<T> {
  newReader() {
    const queue: [Version, Multiset<T>][] = [];
    this.queues.push(queue);
    const reader = new DifferenceStreamRederFromRoot(queue);
    this.readers.push(reader);
    return reader;
  }
}
