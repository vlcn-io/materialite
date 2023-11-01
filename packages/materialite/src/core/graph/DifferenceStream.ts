import { JoinResultVariadic } from "@vlcn.io/ds-and-algos/tuple";
import { Entry, Multiset, PrimitiveValue } from "../multiset.js";
import { Version } from "../types.js";
import { MapOperator } from "./ops/MapOperator.js";
import { FilterOperator } from "./ops/FilterOperator.js";
import { NegateOperator } from "./ops/NegateOperator.js";
import { ConcatOperator } from "./ops/ConcatOperator.js";
import { JoinOperator } from "./ops/JoinOperator.js";
import { ReduceOperator } from "./ops/ReduceOperator.js";
import { CountOperator, LinearCountOperator } from "./ops/CountOperator.js";
import { DebugOperator } from "./ops/DebugOperator.js";
import {
  DifferenceStreamWriter,
  RootDifferenceStreamWriter,
} from "./DifferenceWriter.js";
import { DifferenceStreamReader } from "./DifferenceReader.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { PersistentTreeView, PrimitiveView } from "../../index.js";
import { Source } from "../../sources/Source.js";
import { Msg } from "./Msg.js";
import { IOperator } from "./ops/Operator.js";

/**
 * A difference stream represents a stream of differences.
 *
 * A new stream is created by applying an operator to an existing stream.
 *
 * A difference stream technically represents the output of a source or operator
 * but it does know if its upstream operator and the inputs to this operator.
 *
 * in1  |
 *  \   |
 *   op - out ->
 *  /   |
 * in2  |
 *
 *
 * In other words, the stream is everything to the right of the line but the stream
 * does know of everything to the left of the line. A stream knows its upstreams.
 *
 * This is to facilitate passing messages from the end of a stream back up
 * to the source.
 *
 * This message passing is required for cases when operators and/or views are attached
 * to a stream after the stream has already been activated. In those cases we need to
 * tell the source to send down historical values.
 *
 * The message passing is also required in order to facilitate cleanup. If there are no more consumers for an operator
 * or view we should destroy it. This would in turn destroy its upstreams if they have no more consumers.
 *
 * Finally, messaging passing is also needed for cases when the `source` is sorted. We can leverage sorted
 * sources by passing them the arguments to an `after` operator during re-computation.
 *
 * A stream will only ever have one operator and one output.
 * It can have any number of inputs to that operator, however.
 *
 * An alternate implementation would be for streams to only know of their operator,
 * pass the message to the operator, operator passes message to its upstream input.
 */
export class DifferenceStream<T> {
  #writer;

  // We either have a _source_ or _operator_ off of which this stream comes.
  readonly #source: Source<unknown, unknown> | null;
  readonly #operator: IOperator | null;
  // Keep track of upstreams so when we destroy this stream
  // we can remove ourselves from our upstreams and then that stream,
  // if it has no more consumers, can destroy itself.
  readonly #upstreams: readonly [
    DifferenceStream<unknown>,
    DifferenceStreamReader<unknown>
  ][];

  constructor(
    upstreams: readonly [
      DifferenceStream<unknown>,
      DifferenceStreamReader<unknown>
    ][],
    source: Source<unknown, unknown> | null,
    opCtor: ((w: DifferenceStreamWriter<T>) => IOperator) | null
  ) {
    // TODO: rather than all these invariants we should just have two kinds of DifferenceStreams
    // One that is a stream off a source
    // Another that is a stream off an operator.
    this.#upstreams = upstreams;
    this.#source = source;
    if (upstreams.length === 0) {
      if (!this.#source) {
        throw new Error("Source is required if upstreams do not exist");
      }
      this.#writer = new RootDifferenceStreamWriter<T>();
    } else {
      if (this.#source) {
        throw new Error("Source is not allowed if upstreams exist");
      }
      this.#writer = new DifferenceStreamWriter<T>();
    }
    if (opCtor != null) {
      if (this.#source) {
        throw new Error("Source is not allowed if operator exists");
      }
      this.#operator = opCtor(this.#writer);
    } else {
      if (this.#source == null) {
        throw new Error("Source is required if operator does not exist");
      }
      this.#operator = null;
    }
  }

  pull(msg: Msg) {
    this.#writer.handlePullMsg(msg);
    if (this.#source) {
      if (this.#source._state === "stateful") {
        // TODO: possible to recompute only down the branch that requested recomputation?
        this.#source.resendAll();
      }
    } else {
      for (const [upstream, _] of this.#upstreams) {
        const opMsg = this.#operator?.getMsgForUpstream();
        if (opMsg != null) {
          msg.operatorMessages.push(opMsg);
        }
        upstream.pull(msg);
      }
    }
  }

  map<O>(f: (value: T) => O): DifferenceStream<O> {
    const reader = this.#writer.newReader();
    return new DifferenceStream<O>([[this, reader]], null, (writer) => {
      const op = new MapOperator<T, O>(reader, writer, f);
      reader.setOperator(op);
      return op;
    });
  }

  filter(f: (x: T) => boolean): DifferenceStream<T> {
    const reader = this.#writer.newReader();
    return new DifferenceStream<T>([[this, reader]], null, (writer) => {
      const op = new FilterOperator<T>(reader, writer, f);
      reader.setOperator(op);
      return op;
    });
  }

  // split<K>(f: (x: T) => K): Map<K, DifferenceStream<T>> {
  // }

  negate() {
    const reader = this.#writer.newReader();
    return new DifferenceStream<T>([[this, reader]], null, (writer) => {
      const op = new NegateOperator<T>(reader, writer);
      reader.setOperator(op);
      return op;
    });
  }

  concat<T2>(other: DifferenceStream<T2>) {
    const reader1 = this.#writer.newReader();
    const reader2 = other.#writer.newReader();
    return new DifferenceStream<T | T2>(
      [
        [this, reader1],
        [other, reader2],
      ],
      null,
      (writer) => {
        const op = new ConcatOperator<T, T2>(reader1, reader2, writer);
        reader1.setOperator(op as any);
        reader2.setOperator(op as any);
        return op;
      }
    );
  }

  join<K, R>(
    other: DifferenceStream<R>,
    getKeyThis: (i: T) => K,
    getKeyOther: (i: R) => K
  ): DifferenceStream<
    T extends JoinResultVariadic<[infer T1, ...infer T2]>
      ? JoinResultVariadic<[T1, ...T2, R]>
      : JoinResultVariadic<[T, R]>
  > {
    const reader1 = this.#writer.newReader();
    const reader2 = other.#writer.newReader();
    return new DifferenceStream<any>(
      [
        [this, reader1],
        [other, reader2],
      ],
      null,
      (writer) => {
        const op = new JoinOperator<K, T, R>(
          reader1,
          reader2,
          writer,
          getKeyThis,
          getKeyOther
        );
        reader1.setOperator(op as any);
        reader2.setOperator(op as any);
        return op;
      }
    );
  }

  reduce<K, O>(fn: (i: Entry<T>[]) => Entry<O>[], getKey: (i: T) => K) {
    const reader = this.#writer.newReader();
    return new DifferenceStream<O>([[this, reader]], null, (writer) => {
      const op = new ReduceOperator(reader, writer, getKey, fn);
      reader.setOperator(op as any);
      return op;
    });
  }

  count<K>(getKey: (i: T) => K) {
    const reader = this.#writer.newReader();
    return new DifferenceStream<number>([[this, reader]], null, (writer) => {
      const operator = new CountOperator(reader, writer, getKey);
      reader.setOperator(operator as any);
      return operator;
    });
  }

  /**
   * This differs from count in that `size` just counts the entire
   * stream whereas `count` counts the number of times each key appears.
   * @returns returns the size of the stream
   */
  size() {
    const reader = this.#writer.newReader();
    return new DifferenceStream<number>([[this, reader]], null, (writer) => {
      const operator = new LinearCountOperator(reader, writer);
      reader.setOperator(operator as any);
      return operator;
    });
  }

  materializeInto<T>(ctor: (stream: this) => T): T {
    return ctor(this);
  }

  /**
   * The default materialization strategy.
   *
   * Materializes the stream into a persistent tree.
   *
   * This tree will be incrementally maintained and immutable.
   *
   * Immutable in the sense that each modification of the tree will
   * produce a new version of the tree and not modify prior versions of
   * the tree.
   *
   * Each update to the tree thus produces a new reference.
   * This means reference equality can be used to quickly determine if the tree has changed.
   *
   * A tree was chosen so inserts and deletes anywhere
   * (even in the middle of the structure) are O(logn).
   *
   * The tree can also be indexed as if it were an array. Note that
   * unlike an array, indexing is O(logn) as we have to traverse the tree.
   */
  materialize(c: Comparator<T>): PersistentTreeView<T> {
    return this.materializeInto((stream) => new PersistentTreeView(stream, c));
  }

  materializePrimitive<T extends PrimitiveValue>(
    this: DifferenceStream<T>,
    initial: T
  ): PrimitiveView<T> {
    return this.materializeInto((s) => new PrimitiveView(s, initial));
  }

  /**
   * Run some sort of side-effect against values in the stream.
   * e.g., I/O & logging
   */
  effect(f: (i: Multiset<T>) => void) {
    const reader = this.#writer.newReader();
    return new DifferenceStream<T>([[this, reader]], null, (writer) => {
      const op = new DebugOperator(reader, writer, f);
      reader.setOperator(op);
      return op;
    });
  }

  queueData(data: [Version, Multiset<T>]) {
    this.#writer.queueData(data);
  }

  notify(version: Version) {
    // tell the writer to notify all readers
    this.#writer.notify(version);
  }

  newReader() {
    return this.#writer.newReader();
  }

  removeReader(
    reader: DifferenceStreamReader<T>,
    options: { autoCleanup?: boolean } = { autoCleanup: true }
  ) {
    this.#writer.removeReader(reader);
    // if writer has no readers
    // then destroy the stream
    if (this.#writer.readers.length === 0 && options.autoCleanup === true) {
      this.destroy();
    }
  }

  destroy() {
    // remove ourselves from our upstreams
    for (const [upstream, reader] of this.#upstreams) {
      upstream.removeReader(reader);
    }
  }
}
