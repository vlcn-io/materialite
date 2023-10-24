import { Version } from "../core/types.js";
import { DifferenceStream } from "../index.js";
import { View } from "./View.js";

type PrimitiveValue = boolean | string | number | bigint;

/**
 * Represents the most recent value from a stream of primitives.
 */
export class PrimitiveView<T extends PrimitiveValue> extends View<T, T> {
  #data: T;

  constructor(stream: DifferenceStream<T>, initial: T) {
    super(stream);
    this.#data = initial;
  }

  get data() {
    return this.#data;
  }

  protected run(version: Version) {
    const collections = this.reader.drain(version);
    if (collections.length === 0) {
      return;
    }

    const lastCollection = collections[collections.length - 1]!;
    const lastValue = lastCollection.entries[lastCollection.entries.length - 1];
    if (lastValue === undefined) {
      return;
    }

    const newData = lastValue[0] as T;
    if (newData !== this.#data) {
      this.#data = newData;
      this.notify(newData);
    }
  }
}
