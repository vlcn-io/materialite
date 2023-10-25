import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import { Entry, Multiset } from "../core/multiset.js";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { DifferenceStream } from "../index.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";

/**
 * A set source that retains its contents in an immutable data structure.
 */
export class PersistentSetSource<T> {
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
    this.#stream = new DifferenceStream<T>(true);
    this.#tree = new PersistentTreap<T>(comparator);

    const self = this;
    this.#internal = {
      // add values to queues, add values to the set
      onCommitPhase1(version: Version) {
        for (const [val, mult] of self.#pending) {
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
    this.#stream = new DifferenceStream<T>(true);
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
