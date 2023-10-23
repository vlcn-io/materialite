import { Multiset } from "../multiset.js";
import { Version } from "../types.js";
import {
  DifferenceStreamReader,
  DifferenceStreamRederFromRoot,
} from "./DifferenceReader.js";

/**
 * Write handle
 */
export class DifferenceStreamWriter<T> {
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
    this.queueData([version, data]);
    this.notify(version);
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
