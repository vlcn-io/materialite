import { Version } from "../core/types.js";
import { sinkMutableArray } from "./updateMutableArray.js";
import { Sink } from "./Sink.js";

/**
 * A sink that materializes a stream of differences into an array.
 *
 * This sink mutates the array in place. For immutable sinks, see:
 * - CopyOnWriteArraySink
 * - PersistentTreeSink
 */
export class ArraySink<T> extends Sink<T, T[]> {
  readonly data: T[] = [];

  protected run(version: Version) {
    let changed = false;
    this.reader.drain(version).forEach((collection) => {
      // now we incrementally update our sink.
      changed =
        sinkMutableArray(collection, this.data, this.comparator) || changed;
    });
    // TODO: why is the sink called so damn often?
    if (changed) {
      this.notify(this.data);
    }
  }
}
