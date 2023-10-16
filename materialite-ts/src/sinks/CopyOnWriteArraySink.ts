import { DifferenceStream } from "../core/graph/DifferenceStream";
import { comparator as consolidationComparator } from "../core/consolidation";
import { Version } from "../core/types";
import { sinkMutableArray } from "./updateMutableArray";

/**
 * A sink that materializes a stream of differences into a new copy of an array.
 */
export class CopyOnWriteArraySink<T> {
  readonly #stream;
  readonly #comparator;
  readonly #reader;
  data: readonly T[] = [];

  /**
   * @param stream The stream of differences that should be materialized into this sink
   * @param comparator How to sort results
   */
  constructor(
    stream: DifferenceStream<T>,
    comparator: (l: T, r: T) => number = consolidationComparator
  ) {
    this.#stream = stream;
    this.#comparator = comparator;
    this.#reader = this.#stream.newReader();
    const self = this;
    this.#reader.setOperator({
      run(version: Version) {
        self.#run(version);
      },
    });
  }

  #run(version: Version) {
    const newData = [...this.data];
    this.#reader.drain(version).forEach((collection) => {
      // now we incrementally update our sink.
      sinkMutableArray(collection, newData, this.#comparator);
    });
    this.data = newData;
  }

  destroy() {
    this.#stream.removeReader(this.#reader);
  }
}
