import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { Version } from "../core/types.js";
import { Materialite } from "../materialite.js";
import { View } from "./View.js";

/**
 * Represents the most recent value from a stream of primitives.
 */
export class ValueView<T> extends View<T, T> {
  #data: T;

  constructor(
    materialite: Materialite,
    stream: AbstractDifferenceStream<T>,
    initial: T
  ) {
    super(materialite, stream);
    this.#data = initial;
  }

  get value() {
    return this.#data;
  }

  protected run(version: Version) {
    const collections = this.reader.drain(version);
    if (collections.length === 0) {
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
      this.notify(newData, version);
    } else {
      this.notifiedListenersVersion = version;
    }
  }
}
