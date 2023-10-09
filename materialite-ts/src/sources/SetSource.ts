// This would need to track all live computations
// currently tapped off of the set.
// Clean up taps when they get GC'ed?
// When the sink is removed?

import { DifferenceStream } from "../core/graph/DifferenceStream";
import { Multiset } from "../core/multiset";
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
  #opLog: ((v: Version) => void)[] = [];

  constructor(materialite: MaterialiteForSourceInternal) {
    this.#materialite = materialite;
    this.#stream = new DifferenceStream<T>();
    const self = this;
    this.#internal = {
      // add values to queues, add values to the set
      onCommitPhase1(version: Version) {
        for (const op of self.#opLog) {
          op(version);
        }
        self.#opLog = [];
      },
      // release queues by telling the stream to send data
      onCommitPhase2(version: Version) {
        self.#stream.notify(version);
      },
      onRollback() {
        self.#opLog = [];
      },
    };
  }

  get stream() {
    return this.#stream;
  }

  addAll(values: Iterable<T>): this {
    this.#materialite.addDirtySource(this.#internal);
    this.#opLog.push((version) => {
      const v: [T, number][] = [];
      for (const value of values) {
        v.push([value, 1]);
      }
      this.#stream.queueData([version, new Multiset(v)]);
    });
    return this;
  }

  // TODO: consecutive adds of the same value will create a multiset with a count > 1??
  // making delete problematic?
  add(value: T): this {
    this.#materialite.addDirtySource(this.#internal);
    this.#opLog.push((version) => {
      this.#stream.queueData([version, new Multiset([[value, 1]])]);
    });
    return this;
  }

  // can't do clear given a lack of knowledge of what exists in the set
  // users can implement clear via deleteAll
  // clear(): void {
  //   this.#materialite.addDirtySource(this.#internal);
  // }

  delete(value: T): void {
    this.#materialite.addDirtySource(this.#internal);
    this.#opLog.push((version) => {
      this.#stream.queueData([version, new Multiset([[value, -1]])]);
    });
  }

  deleteAll(values: Iterable<T>): void {
    this.#materialite.addDirtySource(this.#internal);
    this.#opLog.push((version) => {
      const v: [T, number][] = [];
      for (const value of values) {
        v.push([value, -1]);
      }
      this.#stream.queueData([version, new Multiset(v)]);
    });
  }

  // no read methods. To read is to materialize a view
  // from a stream computation against the set.

  // impl as a linear reduction?
  // get size(): number {
  //   return this.#set.size;
  // }
}
