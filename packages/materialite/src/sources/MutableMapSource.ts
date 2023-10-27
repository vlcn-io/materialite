import { Entry, Multiset } from "../core/multiset.js";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { DifferenceStream } from "../index.js";
import { IMemorableSource } from "./Source.js";

/**
 * A MapSource which retains values in a mutable structure.
 */
export class MutableMapSource<K, T> implements IMemorableSource<T, Map<K, T>> {
  readonly type = "stateful";
  #stream: DifferenceStream<T>;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;
  readonly #listeners = new Set<(data: Map<K, T>) => void>();
  #pending: Entry<T>[] = [];
  #recomputeAll = false;
  #map: Map<K, T>;

  constructor(materialite: MaterialiteForSourceInternal, getKey: (t: T) => K) {
    this.#materialite = materialite;
    this.#stream = new DifferenceStream<T>([], this);
    this.#map = new Map();

    const self = this;
    this.#internal = {
      onCommitPhase1(version: Version) {
        for (let i = 0; i < self.#pending.length; i++) {
          const [val, mult] = self.#pending[i]!;
          // small optimization to reduce operations for replace
          if (i + 1 < self.#pending.length) {
            const [nextVal, nextMult] = self.#pending[i + 1]!;
            if (
              Math.abs(mult) === 1 &&
              mult === -nextMult &&
              getKey(val) === getKey(nextVal)
            ) {
              // Do we need this optimization for a regular map?
              self.#map.set(getKey(nextVal), nextMult > 0 ? nextVal : val);
              i += 1;
              continue;
            }
          }
          if (mult < 0) {
            self.#map.delete(getKey(val));
          } else if (mult > 0) {
            self.#map.set(getKey(val), val);
          }
        }

        if (self.#recomputeAll) {
          self.#pending = [];
          self.#recomputeAll = false;
          self.#stream.queueData([version, new Multiset(asEntries(self.#map))]);
        } else {
          self.#stream.queueData([version, new Multiset(self.#pending)]);
          self.#pending = [];
        }
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
        for (const l of self.#listeners) {
          l(self.#map);
        }
      },
      onRollback() {
        self.#pending = [];
      },
    };
  }

  get stream() {
    return this.#stream;
  }

  get data() {
    return this.#map;
  }

  detachPipelines() {
    this.#stream = new DifferenceStream<T>([], this);
  }

  onChange(cb: (data: Map<K, T>) => void) {
    this.#listeners.add(cb);
    return () => this.#listeners.delete(cb);
  }

  add(v: T): this {
    this.#pending.push([v, 1]);
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }

  delete(v: T): this {
    this.#pending.push([v, -1]);
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }

  recomputeAll(): this {
    this.#recomputeAll = true;
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }
}

function asEntries<K, V>(m: Map<K, V>) {
  function* gen() {
    for (const v of m.values()) {
      yield [v, 1] as const;
    }
  }
  return {
    *[Symbol.iterator]() {
      yield* gen();
    },
  };
}
