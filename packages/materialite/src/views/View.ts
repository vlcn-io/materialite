import { comparator as consolidationComparator } from "../core/consolidation.js";
import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { Version } from "../core/types.js";
import { Materialite } from "../materialite.js";
import { IDerivation, ISignal } from "../signal/ISignal.js";

export abstract class View<T, CT> implements ISignal<CT> {
  readonly #stream;
  readonly #materialite: Materialite;
  protected readonly comparator;
  protected readonly reader;
  protected notifiedListenersVersion = -1;
  readonly #listeners: Set<(s: CT, v: Version) => void> = new Set();
  readonly #derivations = new Set<IDerivation<CT>>();

  abstract get value(): CT;

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
      notifyCommitted(v: Version) {
        self.notifyCommitted(self.value, v);
      },
      destroy() {
        self.#stream.removeReader(self.reader);
      },
    });
  }

  get stream() {
    return this.#stream;
  }

  pipe<R>(f: (v: CT) => R): ISignal<R> {
    return this.#materialite.compute(f, this);
  }

  pull() {
    this.#materialite.tx(() => {
      this.reader.pull({
        expressions: [],
      });
    });
  }

  protected notify(d: CT, v: Version) {
    for (const derivation of this.#derivations) {
      derivation.onSignalChanged(d, v);
    }
  }

  protected notifyCommitted(d: CT, v: Version) {
    if (this.notifiedListenersVersion === v) {
      return;
    }
    this.notifiedListenersVersion = v;
    for (const listener of this.#listeners) {
      listener(d, v);
    }
    // TODO: we have to notify our derivations too.
  }

  // TODO: make a signal mixin to mix this into Thunk and View and whomever else.
  _derive(d: IDerivation<CT>) {
    this.#derivations.add(d);
    return () => {
      this.#derivations.delete(d);
      this.#maybeCleanup(true);
    };
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
    this.#maybeCleanup(options.autoCleanup || false);
  }

  #maybeCleanup(autoCleanup: boolean) {
    if (
      autoCleanup &&
      this.#listeners.size === 0 &&
      this.#derivations.size === 0
    ) {
      this.destroy();
    }
  }

  destroy() {
    this.#listeners.clear();
    this.#derivations.clear();
    this.#stream.removeReader(this.reader);
  }

  protected abstract run(v: Version): void;
}
