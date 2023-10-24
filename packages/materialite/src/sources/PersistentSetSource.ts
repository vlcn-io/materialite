import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import { Entry, Multiset } from "../core/multiset.js";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { DifferenceStream } from "../index.js";
import { Comparator } from "@vlcn.io/ds-and-algos/binary-search";

/**
 * A set source that retains its contents in an immutable data structure.
 */
export class PersistentSetSource<T> {
  readonly #stream;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;
  #pending: Entry<T>[] = [];
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
        self.#stream.queueData([version, new Multiset(self.#pending)]);
        for (const [val, mult] of self.#pending) {
          if (mult < 0) {
            self.#tree = self.#tree.delete(val);
          } else if (mult > 0) {
            self.#tree = self.#tree.add(val);
          }
        }
        self.#pending = [];
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
      },
      onRollback() {
        self.#pending = [];
      },
    };
  }

  get data() {
    return this.#tree;
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
}
