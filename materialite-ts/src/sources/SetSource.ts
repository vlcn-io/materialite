// This would need to track all live computations
// currently tapped off of the set.
// Clean up taps when they get GC'ed?
// When the sink is removed?

import { DifferenceStream } from "../core/graph/DifferenceStream";
import { Entry, Multiset } from "../core/multiset";
import {
  ISourceInternal,
  MaterialiteForSourceInternal,
  Version,
} from "../core/types";

// When the user explicitly finalizes them?
// TODO: all mutation methods should take in a `tx` so they can add themselves
// to the active tx?
// and on-commit we can release the queues of all touched
// sources.
// Remember we can optimistically pull too... for the given tx id number anyway.
export class SetSource<T> {
  readonly #stream;
  readonly #internal: ISourceInternal;
  readonly #materialite: MaterialiteForSourceInternal;

  #pending: Entry<T>[] = [];

  constructor(materialite: MaterialiteForSourceInternal) {
    this.#materialite = materialite;
    this.#stream = new DifferenceStream<T>(true);
    const self = this;
    this.#internal = {
      // add values to queues, add values to the set
      onCommitPhase1(version: Version) {
        self.#stream.queueData([version, new Multiset(self.#pending)]);
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

  get stream() {
    return this.#stream;
  }

  addAll(values: Iterable<T>): this {
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

  // impl as a linear reduction?
  // get size(): number {
  //   return this.#set.size;
  // }
}
