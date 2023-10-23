import { Version } from "../core/types.js";
import { comparator as consolidationComparator } from "../core/consolidation.js";
import { DifferenceStream } from "../core/graph/DifferenceStream.js";

export abstract class Sink<T, CT> {
  readonly #stream;
  protected readonly comparator;
  protected readonly reader;
  readonly #listeners: Set<(s: CT) => void> = new Set();

  abstract get data(): CT;

  /**
   * @param stream The stream of differences that should be materialized into this sink
   * @param comparator How to sort results
   */
  constructor(
    stream: DifferenceStream<T>,
    comparator: (l: T, r: T) => number = consolidationComparator
  ) {
    this.#stream = stream;
    this.comparator = comparator;
    this.reader = this.#stream.newReader();
    const self = this;
    this.reader.setOperator({
      run(version: Version) {
        self.run(version);
      },
    });
  }

  protected notify(d: CT) {
    for (const listener of this.#listeners) {
      listener(d);
    }
  }

  onChange(listener: (s: CT) => void) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  destroy() {
    this.#stream.removeReader(this.reader);
  }

  protected abstract run(version: Version): void;
}
