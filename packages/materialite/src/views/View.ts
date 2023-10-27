import { Version } from "../core/types.js";
import { comparator as consolidationComparator } from "../core/consolidation.js";
import { DifferenceStream } from "../core/graph/DifferenceStream.js";

export abstract class View<T, CT> {
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

  get stream() {
    return this.#stream;
  }

  pull() {
    this.#stream.pull();
  }

  protected notify(d: CT) {
    for (const listener of this.#listeners) {
      listener(d);
    }
  }

  onChange(listener: (s: CT) => void) {
    this.#listeners.add(listener);
    return () => {
      this.removeListener(listener);
    };
  }

  /**
   * If there are 0 listeners left after removing the given listener,
   * the view is destroyed.
   *
   * To opt out of this behavior, pass `autoCleanup: false`
   * @param listener
   */
  removeListener(
    listener: (s: CT) => void,
    options: { autoCleanup?: boolean } = { autoCleanup: true }
  ) {
    this.#listeners.delete(listener);
    if (this.#listeners.size === 0 && options.autoCleanup === true) {
      this.destroy();
    }
  }

  destroy() {
    this.#listeners.clear();
    this.#stream.removeReader(this.reader);
  }

  protected abstract run(version: Version): void;
}
