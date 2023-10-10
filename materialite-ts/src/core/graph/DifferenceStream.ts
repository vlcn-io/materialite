import { Multiset } from "../multiset";
import { Version } from "../types";
import { RootDifferenceStreamWriter } from "./graph";
import { DebugOperator, MapOperator } from "./operators";

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

  map<O>(f: (value: T) => O): DifferenceStream<O> {
    const output = new DifferenceStream<O>(false);
    const reader = this.#writer.newReader();
    const op = new MapOperator<T, O>(reader, output.#writer, f);
    reader.setOperator(op as any);
    return output;
  }

  debug(f: (i: Multiset<T>) => void) {
    const output = new DifferenceStream<T>(false);
    const reader = this.#writer.newReader();
    const op = new DebugOperator(reader, output.#writer, f);
    reader.setOperator(op);
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
