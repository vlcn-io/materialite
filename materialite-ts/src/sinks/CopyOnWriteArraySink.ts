import { Version } from "../core/types";
import { sinkMutableArray } from "./updateMutableArray";
import { Sink } from "./Sink";

/**
 * A sink that materializes a stream of differences into a new copy of an array.
 */
export class CopyOnWriteArraySink<T> extends Sink<T, readonly T[]> {
  #data: readonly T[] = [];

  get data() {
    return this.#data;
  }

  protected run(version: Version) {
    const collections = this.reader.drain(version);
    if (collections.length === 0) {
      return;
    }

    const newData = [...this.#data];
    let changed = false;
    collections.forEach((collection) => {
      // now we incrementally update our sink.
      changed =
        sinkMutableArray(collection, newData, this.comparator) || changed;
    });
    this.#data = newData;
    if (changed) {
      this.notify(newData);
    }
  }
}
