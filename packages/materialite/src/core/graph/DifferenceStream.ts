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
import { Comparator } from "@vlcn.io/ds-and-algos/binary-search";
import { PersistentTreeView, PrimitiveView } from "../../index.js";

export class DifferenceStream<T> {
  readonly #writer;

  constructor(root: boolean) {
    // set write to a new difference stream writer
    if (root) {
      this.#writer = new RootDifferenceStreamWriter<T>();
    } else {
      this.#writer = new DifferenceStreamWriter<T>();
    }
  }

  map<O>(f: (value: T) => O): DifferenceStream<O> {
    const output = new DifferenceStream<O>(false);
    const reader = this.#writer.newReader();
    const op = new MapOperator<T, O>(reader, output.#writer, f);
    reader.setOperator(op as any);
    return output;
  }

  filter(f: (x: T) => boolean): DifferenceStream<T> {
    const output = new DifferenceStream<T>(false);
    const reader = this.#writer.newReader();
    const op = new FilterOperator<T>(reader, output.#writer, f);
    reader.setOperator(op);
    return output;
  }

  negate() {
    const output = new DifferenceStream<T>(false);
    const reader = this.#writer.newReader();
    const op = new NegateOperator<T>(reader, output.#writer);
    reader.setOperator(op);
    return output;
  }

  concat<T2>(other: DifferenceStream<T2>) {
    const output = new DifferenceStream<T | T2>(false);
    const reader1 = this.#writer.newReader();
    const reader2 = other.#writer.newReader();
    const op = new ConcatOperator<T, T2>(reader1, reader2, output.#writer);
    reader1.setOperator(op as any);
    reader2.setOperator(op as any);
    return output;
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
    const output = new DifferenceStream<any>(false);
    const reader1 = this.#writer.newReader();
    const reader2 = other.#writer.newReader();
    const op = new JoinOperator<K, T, R>(
      reader1,
      reader2,
      output.#writer,
      getKeyThis,
      getKeyOther
    );
    reader1.setOperator(op as any);
    reader2.setOperator(op as any);
    return output;
  }

  reduce<K, O>(fn: (i: Entry<T>[]) => Entry<O>[], getKey: (i: T) => K) {
    const output = new DifferenceStream<O>(false);
    const reader = this.#writer.newReader();
    const operator = new ReduceOperator(reader, output.#writer, getKey, fn);
    reader.setOperator(operator as any);
    return output;
  }

  count<K>(getKey: (i: T) => K) {
    const output = new DifferenceStream<number>(false);
    const reader = this.#writer.newReader();
    const operator = new CountOperator(reader, output.#writer, getKey);
    reader.setOperator(operator as any);
    return output;
  }

  /**
   * This differs from count in that `size` just counts the entire
   * stream whereas `count` counts the number of times each key appears.
   * @returns returns the size of the stream
   */
  size() {
    const output = new DifferenceStream<number>(false);
    const reader = this.#writer.newReader();
    const operator = new LinearCountOperator(reader, output.#writer);
    reader.setOperator(operator as any);
    return output;
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

  debug(f: (i: Multiset<T>) => void) {
    const output = new DifferenceStream<T>(false);
    const reader = this.#writer.newReader();
    const op = new DebugOperator(reader, output.#writer, f);
    reader.setOperator(op);
    return output;
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

  removeReader(reader: DifferenceStreamReader<T>) {
    this.#writer.removeReader(reader);
  }
}
