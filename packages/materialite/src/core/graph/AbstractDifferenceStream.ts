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
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { DifferenceStreamReader } from "./DifferenceReader.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";
import {
  DifferenceStream,
  PersistentTreeView,
  PrimitiveView,
} from "../../index.js";
import { Msg } from "./Msg.js";
import { AfterOperator } from "./ops/AfterOperator.js";
import { TakeOperator } from "./ops/TakeOperator.js";

export abstract class AbstractDifferenceStream<T> {
  constructor(protected writer: DifferenceStreamWriter<T>) {}

  abstract destroy(): void;
  abstract pull(msg: Msg): void;

  // only enable `after` for streams streamed off of sorted things?
  // no, it is fine on any stream.
  // it is just a matter of the source recognizing what it sends the source on re-pull
  // or not.
  after(v: T, comparator: Comparator<T>): DifferenceStream<T> {
    const reader = this.writer.newReader();
    return new DifferenceStream<T>([[this, reader]], (writer) => {
      const op = new AfterOperator<T>(reader, writer, v, comparator);
      reader.setOperator(op);
      return op;
    });
  }

  take(n: number, comparator: Comparator<T>): DifferenceStream<T> {
    const reader = this.writer.newReader();
    return new DifferenceStream<T>([[this, reader]], (writer) => {
      const op = new TakeOperator<T>(reader, writer, n, comparator);
      reader.setOperator(op);
      return op;
    });
  }

  map<O>(f: (value: T) => O): DifferenceStream<O> {
    const reader = this.writer.newReader();
    return new DifferenceStream<O>([[this, reader]], (writer) => {
      const op = new MapOperator<T, O>(reader, writer, f);
      reader.setOperator(op);
      return op;
    });
  }

  filter(f: (x: T) => boolean): DifferenceStream<T> {
    const reader = this.writer.newReader();
    return new DifferenceStream<T>([[this, reader]], (writer) => {
      const op = new FilterOperator<T>(reader, writer, f);
      reader.setOperator(op);
      return op;
    });
  }

  // split<K>(f: (x: T) => K): Map<K, DifferenceStream<T>> {
  // }

  negate(): DifferenceStream<T> {
    const reader = this.writer.newReader();
    return new DifferenceStream<T>([[this, reader]], (writer) => {
      const op = new NegateOperator<T>(reader, writer);
      reader.setOperator(op);
      return op;
    });
  }

  concat<T2>(other: AbstractDifferenceStream<T2>): DifferenceStream<T | T2> {
    const reader1 = this.writer.newReader();
    const reader2 = other.writer.newReader();
    return new DifferenceStream<T | T2>(
      [
        [this, reader1],
        [other, reader2],
      ],
      (writer) => {
        const op = new ConcatOperator<T, T2>(reader1, reader2, writer);
        reader1.setOperator(op as any);
        reader2.setOperator(op as any);
        return op;
      }
    );
  }

  join<K, R>(
    other: AbstractDifferenceStream<R>,
    getKeyThis: (i: T) => K,
    getKeyOther: (i: R) => K
  ): DifferenceStream<
    T extends JoinResultVariadic<[infer T1, ...infer T2]>
      ? JoinResultVariadic<[T1, ...T2, R]>
      : JoinResultVariadic<[T, R]>
  > {
    const reader1 = this.writer.newReader();
    const reader2 = other.writer.newReader();
    return new DifferenceStream<any>(
      [
        [this, reader1],
        [other, reader2],
      ],
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

  reduce<K, O>(
    fn: (i: Entry<T>[]) => Entry<O>[],
    getKey: (i: T) => K
  ): DifferenceStream<O> {
    const reader = this.writer.newReader();
    return new DifferenceStream<O>([[this, reader]], (writer) => {
      const op = new ReduceOperator(reader, writer, getKey, fn);
      reader.setOperator(op as any);
      return op;
    });
  }

  count<K>(getKey: (i: T) => K): DifferenceStream<number> {
    const reader = this.writer.newReader();
    return new DifferenceStream<number>([[this, reader]], (writer) => {
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
    const reader = this.writer.newReader();
    return new DifferenceStream<number>([[this, reader]], (writer) => {
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
    const reader = this.writer.newReader();
    return new DifferenceStream<T>([[this, reader]], (writer) => {
      const op = new DebugOperator(reader, writer, f);
      reader.setOperator(op);
      return op;
    });
  }

  queueData(data: [Version, Multiset<T>]) {
    this.writer.queueData(data);
  }

  notify(version: Version) {
    // tell the writer to notify all readers
    this.writer.notify(version);
  }

  newReader() {
    return this.writer.newReader();
  }

  removeReader(
    reader: DifferenceStreamReader<T>,
    options: { autoCleanup?: boolean } = { autoCleanup: true }
  ) {
    this.writer.removeReader(reader);
    // if writer has no readers
    // then destroy the stream
    if (this.writer.readers.length === 0 && options.autoCleanup === true) {
      this.destroy();
    }
  }
}
