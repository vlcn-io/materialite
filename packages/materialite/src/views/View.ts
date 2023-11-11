import { comparator as consolidationComparator } from "../core/consolidation.js";
import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { Version } from "../core/types.js";
import { Materialite } from "../materialite.js";

export abstract class View<T, CT> {
  readonly #stream;
  readonly #materialite: Materialite;
  protected readonly comparator;
  protected readonly reader;
  readonly #listeners: Set<(s: CT) => void> = new Set();

  abstract get data(): CT;

  /**
   * @param stream The stream of differences that should be materialized into this sink
   * @param comparator How to sort results
   */
  constructor(
    materialite: Materialite,
    stream: AbstractDifferenceStream<T>,
    comparator: (l: T, r: T) => number = consolidationComparator
  ) {
    this.#materialite = materialite;
    this.#stream = stream;
    this.comparator = comparator;
    this.reader = this.#stream.newReader();
    const self = this;
    this.reader.setOperator({
      run(v: Version) {
        self.run(v);
      },
      pull() {
        return null;
      },
      destroy() {
        self.#stream.removeReader(self.reader);
      },
    });
  }

  get stream() {
    return this.#stream;
  }

  pull() {
    this.#materialite.tx(() => {
      this.reader.pull({
        expressions: [],
      });
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

  protected abstract run(v: Version): void;
}
