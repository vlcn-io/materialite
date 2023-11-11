// This would need to track all live computations
// currently tapped off of the set.
// Clean up taps when they get GC'ed?
// When the sink is removed?

import { RootDifferenceStream } from "../core/graph/RootDifferenceStream.js";
import { Entry, Multiset } from "../core/multiset.js";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types.js";
import { IStatelessSource, IUnsortedSource, KeyFn } from "./Source.js";

export class SetSource<T>
  implements IStatelessSource<T>, IUnsortedSource<T, T>
{
  readonly _state = "stateless";
  readonly _sort = "unsorted";
  readonly keyFn: KeyFn<T, T> = (v) => v;
  #stream: RootDifferenceStream<T>;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;

  #pending: Entry<T>[] = [];

  constructor(materialite: MaterialiteForSourceInternal) {
    this.#materialite = materialite;
    this.#stream = new RootDifferenceStream<T>(materialite.materialite, this);
    const self = this;
    this.#internal = {
      // add values to queues, add values to the set
      onCommitPhase1(version: Version) {
        self.#stream.queueData([version, new Multiset(self.#pending, null)]);
        self.#pending = [];
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
      },
      // notify effects / listeners
      // this is done once the entire reactive graph has finished computing
      // itself
      onCommitted(v: Version) {
        self.#stream.notifyCommitted(v);
      },
      onRollback() {
        self.#pending = [];
      },
    };
  }

  get stream() {
    return this.#stream;
  }

  detachPipelines() {
    this.#stream = new RootDifferenceStream<T>(
      this.#materialite.materialite,
      this
    );
  }

  addAll(values: Iterable<T>): this {
    // TODO (mlaw): start a materialite transaction
    for (const v of values) {
      this.#pending.push([v, 1]);
    }
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }

  // TODO: consecutive adds of the same value will create a multiset with a count > 1??
  // making delete problematic?
  add(value: T): this {
    this.#pending.push([value, 1]);
    this.#materialite.addDirtySource(this.#internal);
    return this;
  }

  // can't do clear given a lack of knowledge of what exists in the set
  // users can implement clear via deleteAll
  // clear(): void {
  //   this.#materialite.addDirtySource(this.#internal);
  // }

  delete(value: T): void {
    this.#pending.push([value, -1]);
    this.#materialite.addDirtySource(this.#internal);
  }

  deleteAll(values: Iterable<T>): void {
    for (const v of values) {
      this.#pending.push([v, -1]);
    }
    this.#materialite.addDirtySource(this.#internal);
  }

  // no read methods. To read is to materialize a view
  // from a stream computation against the set.
}
