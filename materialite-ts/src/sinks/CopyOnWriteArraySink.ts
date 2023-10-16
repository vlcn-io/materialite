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
    const newData = [...this.#data];
    this.reader.drain(version).forEach((collection) => {
      // now we incrementally update our sink.
      sinkMutableArray(collection, newData, this.comparator);
    });
    this.#data = newData;
  }
}
