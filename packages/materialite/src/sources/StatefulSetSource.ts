import { Comparator, ITreap } from "@vlcn.io/ds-and-algos/types";
import { IStatefulSource } from "./Source.js";
import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { Entry, Multiset } from "../core/multiset.js";
import { Msg } from "../core/graph/Msg.js";
import { RootDifferenceStream } from "../core/graph/RootDifferenceStream.js";

export abstract class StatefulSetSource<T>
  implements IStatefulSource<T, ITreap<T>>
{
  readonly _state = "stateful";
  readonly _sort = "sorted";

  #stream: RootDifferenceStream<T>;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;
  readonly #listeners = new Set<(data: ITreap<T>) => void>();
  #pending: Entry<T>[] = [];
  #recomputeAll: Msg | null = null;
  #tree: ITreap<T>;
  readonly comparator: Comparator<T>;

  constructor(
    materialite: MaterialiteForSourceInternal,
    comparator: Comparator<T>,
    treapConstructor: () => ITreap<T>
  ) {
    this.#materialite = materialite;
    this.#stream = new RootDifferenceStream<T>(this);
    this.#tree = treapConstructor();
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
          self.#recomputeAll = null;
          self.#stream.queueData([
            version,
            // TODO: iterator at `after` position
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
    this.#stream = new RootDifferenceStream<T>(this);
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

  resendAll(msg: Msg): this {
    this.#recomputeAll = msg;
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }
}

function* asEntries<T>(m: ITreap<T>) {
  function* gen() {
    for (const v of m) {
      yield [v, 1] as const;
    }
  }
  return {
    *[Symbol.iterator]() {
      yield* gen();
    },
  };
}
