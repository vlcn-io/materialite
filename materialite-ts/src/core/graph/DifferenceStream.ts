import { Multiset } from "../multiset";
import { Version } from "../types";
import { RootDifferenceStreamWriter } from "./graph";

export class DifferenceStream<T> {
  readonly #writer;

  constructor(root: boolean) {
    // set write to a new difference stream writer
    if (root) {
      this.#writer = new RootDifferenceStreamWriter<T>();
    } else {
      this.#writer = new RootDifferenceStreamWriter<T>();
    }
  }

  map<O>(_f: (value: T) => O): DifferenceStream<O> {
    const output = new DifferenceStream<O>(false);
    // const operator = new MapO
    return output;
  }

  queueData(data: [Version, Multiset<T>]) {
    this.#writer.queueData(data);
  }

  notify(version: Version) {
    // tell the writer to notify all readers
    this.#writer.notify(version);
  }
}
