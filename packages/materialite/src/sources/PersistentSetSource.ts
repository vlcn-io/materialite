import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import { Entry, Multiset } from "../core/multiset.js";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { DifferenceStream } from "../index.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { IMemorableSource } from "./Source.js";

/**
 * A set source that retains its contents in an immutable data structure.
 */
export class PersistentSetSource<T>
  implements IMemorableSource<T, PersistentTreap<T>>
{
  #stream;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;
  readonly #listeners = new Set<(data: PersistentTreap<T>) => void>();
  #pending: Entry<T>[] = [];
  #recomputeAll = false;
  #tree: PersistentTreap<T>;

  constructor(
    materialite: MaterialiteForSourceInternal,
    comparator: Comparator<T>
  ) {
    this.#materialite = materialite;
    this.#stream = new DifferenceStream<T>([]);
    this.#tree = new PersistentTreap<T>(comparator);

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
              comparator(val, nextVal) == 0
            ) {
              // The tree doesn't allow dupes -- so this is a replace.
              self.#tree = self.#tree.add(nextMult > 0 ? nextVal : val);
              i += 1;
              continue;
            }
          }
          if (mult < 0) {
            self.#tree = self.#tree.delete(val);
          } else if (mult > 0) {
            self.#tree = self.#tree.add(val);
          }
        }

        if (self.#recomputeAll) {
          self.#pending = [];
          self.#recomputeAll = false;
          self.#stream.queueData([
            version,
            new Multiset(asEntries(self.#tree)),
          ]);
        } else {
          self.#stream.queueData([version, new Multiset(self.#pending)]);
          self.#pending = [];
        }
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
        const tree = self.#tree;
        for (const l of self.#listeners) {
          l(tree);
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
    return this.#tree;
  }

  detachPipelines() {
    this.#stream = new DifferenceStream<T>([]);
  }

  onChange(cb: (data: PersistentTreap<T>) => void) {
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

function* asEntries<T>(tree: PersistentTreap<T>) {
  for (const v of tree) {
    yield [v, 1] as const;
  }
}
