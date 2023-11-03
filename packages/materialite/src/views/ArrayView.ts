import { EventMetadata } from "../core/types.js";
import { materializeMutableArray } from "./updateMutableArray.js";
import { View as View } from "./View.js";

/**
 * A sink that materializes a stream of differences into an array.
 *
 * This sink mutates the array in place. For immutable sinks, see:
 * - CopyOnWriteArraySink
 * - PersistentTreeSink
 */
export class ArrayView<T> extends View<T, T[]> {
  readonly data: T[] = [];

  protected run(e: EventMetadata) {
    let changed = false;
    if (e.cause === "full_recompute") {
      changed = this.data.length > 0;
      this.data.length = 0;
    }
    this.reader.drain(e.version).forEach((collection) => {
      // now we incrementally update our sink.
      changed =
        materializeMutableArray(collection, this.data, this.comparator) ||
        changed;
    });
    // TODO: why is the sink called so damn often?
    if (changed) {
      this.notify(this.data);
    }
  }
}
