import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { Version } from "../core/types.js";
import { Materialite } from "../materialite.js";
import { View } from "./View.js";

type PrimitiveValue = boolean | string | number | bigint;

/**
 * Represents the most recent value from a stream of primitives.
 */
export class PrimitiveView<T extends PrimitiveValue> extends View<T, T> {
  #data: T;
  // readonly #initial: T;

  constructor(
    materialite: Materialite,
    stream: AbstractDifferenceStream<T>,
    initial: T
  ) {
    super(materialite, stream);
    this.#data = initial;
    // this.#initial = initial;
  }

  get data() {
    return this.#data;
  }

  protected run(version: Version) {
    const collections = this.reader.drain(version);
    // if (e.cause === "full_recompute") {
    //   this.#data = this.#initial;
    // }
    if (collections.length === 0) {
      this.notify(this.#data);
      return;
    }

    const lastCollection = collections[collections.length - 1]!;
    // const lastValue = lastCollection.entries[lastCollection.entries.length - 1];
    let lastValue = undefined;
    for (const [value, mult] of lastCollection.entries) {
      if (mult > 0) {
        lastValue = value;
      }
    }
    if (lastValue === undefined) {
      return;
    }

    const newData = lastValue as T;
    if (newData !== this.#data) {
      this.#data = newData;
      this.notify(newData);
    }
  }
}
