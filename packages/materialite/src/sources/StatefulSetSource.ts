import { Comparator, ITree } from "@vlcn.io/ds-and-algos/types";
import { IStatefulSource } from "./Source.js";
import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { Entry, Multiset } from "../core/multiset.js";
import { Hoisted } from "../core/graph/Msg.js";
import { RootDifferenceStream } from "../core/graph/RootDifferenceStream.js";

export abstract class StatefulSetSource<T>
  implements IStatefulSource<T, ITree<T>>
{
  readonly _state = "stateful";
  readonly _sort = "sorted";

  #stream: RootDifferenceStream<T>;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;
  readonly #listeners = new Set<(data: ITree<T>) => void>();
  #pending: Entry<T>[] = [];
  #recomputeAll: Hoisted | null = null;
  #tree: ITree<T>;
  readonly comparator: Comparator<T>;

  constructor(
    materialite: MaterialiteForSourceInternal,
    comparator: Comparator<T>,
    treapConstructor: (comparator: Comparator<T>) => ITree<T>
  ) {
    this.#materialite = materialite;
    this.#stream = new RootDifferenceStream<T>(materialite.materialite, this);
    this.#tree = treapConstructor(comparator);
    this.comparator = comparator;

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
          self.#stream.queueData([
            version,
            // TODO: add event to multiset
            new Multiset(
              asEntries(self.#tree, self.comparator, self.#recomputeAll),
              {
                cause: "full_recompute",
                comparator,
              }
            ),
          ]);
          self.#recomputeAll = null;
        } else {
          self.#stream.queueData([version, new Multiset(self.#pending, null)]);
          self.#pending = [];
        }
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
      },
      onCommitted(version: Version) {
        // In case we have direct source observers
        const tree = self.#tree;
        for (const l of self.#listeners) {
          l(tree);
        }
        self.#stream.notifyCommitted(version);
      },
      onRollback() {
        self.#pending = [];
      },
    };
  }

  get stream() {
    return this.#stream;
  }

  get value() {
    return this.#tree;
  }

  detachPipelines() {
    this.#stream = new RootDifferenceStream<T>(
      this.#materialite.materialite,
      this
    );
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

  resendAll(msg: Hoisted): this {
    this.#recomputeAll = msg;
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }
}

function asEntries<T>(
  m: ITree<T>,
  _comparator: Comparator<T>,
  _hoisted: Hoisted
): Iterable<Entry<T>> {
  // const _after = hoisted.expressions.filter((e) => e._tag === "after")[0];
  // if (after && after.comparator === comparator) {
  //   return {
  //     [Symbol.iterator]() {
  //       return m.iteratorAfter(after.cursor as any);
  //     },
  //   };
  // }
  return {
    [Symbol.iterator]() {
      return gen(m);
    },
  };
}

function* gen<T>(m: ITree<T>) {
  for (const v of m) {
    yield [v, 1] as const;
  }
}
