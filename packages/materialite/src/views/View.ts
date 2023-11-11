import { comparator as consolidationComparator } from "../core/consolidation.js";
import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { Version } from "../core/types.js";
import { Materialite } from "../materialite.js";
import { ISignal } from "../signal/ISignal.js";

export abstract class View<T, CT> implements ISignal<CT> {
  readonly #stream;
  readonly #materialite: Materialite;
  protected readonly comparator;
  protected readonly reader;
  readonly #listeners: Set<(s: CT, v: Version) => void> = new Set();
  #currentVersion = -1;

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
        self.#currentVersion = v;
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
      listener(d, this.#currentVersion);
    }
  }

  on(listener: (s: CT, v: Version) => void) {
    this.#listeners.add(listener);
    return () => {
      this.off(listener);
    };
  }

  /**
   * If there are 0 listeners left after removing the given listener,
   * the view is destroyed.
   *
   * To opt out of this behavior, pass `autoCleanup: false`
   * @param listener
   */
  off(
    listener: (s: CT, v: Version) => void,
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
