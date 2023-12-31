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
import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { ISignal } from "../index.js";
import { IDerivation } from "../signal/ISignal.js";

export abstract class StatefulSetSource<T>
  implements IStatefulSource<T, ITree<T>>, ISignal<ITree<T>>
{
  readonly _state = "stateful";
  readonly _sort = "sorted";

  #stream: RootDifferenceStream<T>;
  readonly #internal: ISourceInternal;
  protected readonly materialite: MaterialiteForSourceInternal;
  readonly #listeners = new Set<(data: ITree<T>) => void>();
  #pending: Entry<T>[] = [];
  #recompute: Hoisted | null = null;
  #tree: ITree<T>;
  readonly comparator: Comparator<T>;

  constructor(
    materialite: MaterialiteForSourceInternal,
    comparator: Comparator<T>,
    treapConstructor: (comparator: Comparator<T>) => ITree<T>
  ) {
    this.materialite = materialite;
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

        if (self.#recompute) {
          self.#pending = [];
          self.#stream.queueData([
            version,
            // TODO: if there is `after` (or anything hoisted?) it is a `partial_recompute` not `full`
            // If _after_ is at the end of a pipline, can we ensure
            // that all operators up till after behave correctly on seeing duplicated data?
            // We either need to inject retractions or ignore partial recomputes?
            // If the end of the pipeline is driving hoisting, like a view re-materialization,
            // we have issues.
            // This is a reason to reconsider rematerialization.
            // This is problematic for linear count operators.
            // How can we keep an accurate count in the face of a partial
            // recompute unless we issue retractions first?
            new Multiset(
              asEntries(self.#tree, self.comparator, self.#recompute),
              {
                cause:
                  self.#recompute.expressions.length > 0
                    ? "partial_recompute"
                    : "full_recompute",
                comparator,
              }
            ),
          ]);
        } else {
          self.#stream.queueData([version, new Multiset(self.#pending, null)]);
          self.#pending = [];
        }
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        if (self.#recompute) {
          self.#stream.notify(
            version,
            self.#recompute.expressions.length > 0
              ? "partial_recompute"
              : "full_recompute"
          );
          self.#recompute = null;
        } else {
          self.#stream.notify(version, "difference");
        }
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

  abstract withNewOrdering(comp: Comparator<T>): this;

  get stream(): AbstractDifferenceStream<T> {
    return this.#stream;
  }

  get value() {
    return this.#tree;
  }

  detachPipelines() {
    this.#stream = new RootDifferenceStream<T>(
      this.materialite.materialite,
      this
    );
  }

  destroy(): void {
    this.detachPipelines();
    this.#listeners.clear();
  }

  onChange(cb: (data: PersistentTreap<T>) => void) {
    this.#listeners.add(cb);
    return () => this.#listeners.delete(cb);
  }

  // TODO: implement these correctly.
  on(fn: (value: PersistentTreap<T>, version: number) => void): () => void {
    return this.onChange(fn as any);
  }

  off(fn: (value: PersistentTreap<T>, version: number) => void): void {
    this.#listeners.delete(fn as any);
  }

  pipe<R>(_: (v: PersistentTreap<T>) => R): ISignal<R> {
    throw new Error("Method not implemented.");
  }

  _derive(_: IDerivation<PersistentTreap<T>>): () => void {
    throw new Error("Method not implemented.");
  }

  add(v: T): this {
    this.#pending.push([v, 1]);
    this.materialite.addDirtySource(this.#internal);
    return this;
  }

  delete(v: T): this {
    this.#pending.push([v, -1]);
    this.materialite.addDirtySource(this.#internal);
    return this;
  }

  resendAll(msg: Hoisted): this {
    this.#recompute = msg;
    this.materialite.addDirtySource(this.#internal);
    return this;
  }
}

function asEntries<T>(
  m: ITree<T>,
  comparator: Comparator<T>,
  hoisted: Hoisted
): Iterable<Entry<T>> {
  const after = hoisted.expressions.filter((e) => e._tag === "after")[0];
  if (after && after.comparator === comparator) {
    return {
      [Symbol.iterator]() {
        return gen(m.iteratorAfter(after.cursor as any));
      },
    };
  }
  return {
    [Symbol.iterator]() {
      return gen(m);
    },
  };
}

function* gen<T>(m: Iterable<T>) {
  for (const v of m) {
    yield [v, 1] as const;
  }
}
