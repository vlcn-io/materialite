import { Multiset } from "../multiset";
import { Version } from "../types";
import { DifferenceStreamWriter } from "./graph";

export class DifferenceStream<T> {
  readonly #writer;

  constructor() {
    // set write to a new difference stream writer
    this.#writer = new DifferenceStreamWriter<T>();
  }

  map<O>(f: (value: T) => O): DifferenceStream<O> {
    const output = new DifferenceStream<O>();
    // const operator = new MapO
  }

  queueData(data: [Version, Multiset<T>]) {
    this.#writer.queueData(data);
  }

  notify(version: Version) {
    // tell the write to notify all readers
  }
}
