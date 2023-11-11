import { JoinResultVariadic } from "@vlcn.io/ds-and-algos/tuple";
import { Entry, Multiset } from "../multiset.js";
import { Version } from "../types.js";
import { MapOperator } from "./ops/MapOperator.js";
import { FilterOperator } from "./ops/FilterOperator.js";
import { NegateOperator } from "./ops/NegateOperator.js";
import { ConcatOperator } from "./ops/ConcatOperator.js";
import { JoinOperator } from "./ops/JoinOperator.js";
import { ReduceOperator } from "./ops/ReduceOperator.js";
import { CountOperator, LinearCountOperator } from "./ops/CountOperator.js";
import { EffectOperator } from "./ops/EffectOperator.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { DifferenceStreamReader } from "./DifferenceReader.js";
import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { Hoisted } from "./Msg.js";
import { AfterOperator } from "./ops/AfterOperator.js";
import { TakeOperator } from "./ops/TakeOperator.js";

import { PersistentTreeView } from "../../views/PersistentTreeView.js";
import { ValueView } from "../../views/PrimitiveView.js";
import {
  EffectOptions,
  IDifferenceStream,
  MaterializeOptions,
} from "./IDifferenceStream.js";
import { Materialite } from "../../materialite.js";
import { ArrayView } from "../../views/ArrayView.js";
import { CopyOnWriteArrayView } from "../../views/CopyOnWriteArrayView.js";
import { View } from "../../views/View.js";

export abstract class AbstractDifferenceStream<T>
  implements IDifferenceStream<T>
{
  constructor(
    protected readonly materialite: Materialite,
    protected writer: DifferenceStreamWriter<T>
  ) {}

  protected abstract newStream<X>(): AbstractDifferenceStream<X>;

  pull(msg: Hoisted): void {
    this.writer.pull(msg);
  }

  // only enable `after` for streams streamed off of sorted things?
  // no, it is fine on any stream.
  // it is just a matter of the source recognizing what it sends the source on re-pull
  // or not.
  after(v: T, comparator: Comparator<T>): AbstractDifferenceStream<T> {
    const ret = this.newStream<T>();
    new AfterOperator<T>(this.writer.newReader(), ret.writer, v, comparator);
    return ret;
  }

  take(n: number, comparator: Comparator<T>): AbstractDifferenceStream<T> {
    const ret = this.newStream<T>();
    new TakeOperator<T>(this.writer.newReader(), ret.writer, n, comparator);
    return ret;
  }

  map<O>(f: (value: T) => O): AbstractDifferenceStream<O> {
    const ret = this.newStream<O>();
    new MapOperator<T, O>(this.writer.newReader(), ret.writer, f);
    return ret;
  }

  filter(f: (x: T) => boolean): AbstractDifferenceStream<T> {
    const ret = this.newStream<T>();
    new FilterOperator<T>(this.writer.newReader(), ret.writer, f);
    return ret;
  }

  // split<K>(f: (x: T) => K): Map<K, DifferenceStream<T>> {
  // }

  negate(): AbstractDifferenceStream<T> {
    const ret = this.newStream<T>();
    new NegateOperator<T>(this.writer.newReader(), ret.writer);
    return ret;
  }

  concat<T2>(
    other: AbstractDifferenceStream<T2>
  ): AbstractDifferenceStream<T | T2> {
    const ret = this.newStream<T | T2>();
    new ConcatOperator<T, T2>(
      this.writer.newReader(),
      other.writer.newReader(),
      ret.writer
    );
    return ret;
  }

  join<K, R>(
    other: AbstractDifferenceStream<R>,
    getKeyThis: (i: T) => K,
    getKeyOther: (i: R) => K
  ): AbstractDifferenceStream<
    T extends JoinResultVariadic<[infer T1, ...infer T2]>
      ? JoinResultVariadic<[T1, ...T2, R]>
      : JoinResultVariadic<[T, R]>
  > {
    const ret = this.newStream<any>();
    new JoinOperator<K, T, R>(
      this.writer.newReader(),
      other.writer.newReader(),
      ret.writer,
      getKeyThis,
      getKeyOther
    );
    return ret;
  }

  reduce<K, O>(
    fn: (i: Entry<T>[]) => Entry<O>[],
    getKey: (i: T) => K
  ): AbstractDifferenceStream<O> {
    const ret = this.newStream<O>();
    new ReduceOperator(this.writer.newReader(), ret.writer, getKey, fn);
    return ret;
  }

  count<K>(getKey: (i: T) => K): AbstractDifferenceStream<number> {
    const ret = this.newStream<number>();
    new CountOperator(this.writer.newReader(), ret.writer, getKey);
    return ret;
  }

  /**
   * This differs from count in that `size` just counts the entire
   * stream whereas `count` counts the number of times each key appears.
   * @returns returns the size of the stream
   */
  size() {
    const ret = this.newStream<number>();
    new LinearCountOperator(this.writer.newReader(), ret.writer);
    return ret;
  }

  materializeInto<T extends View<V, VC>, V, VC>(
    ctor: (stream: this) => T,
    options: MaterializeOptions = { wantInitialData: true }
  ): T {
    const view = ctor(this);
    if (options.wantInitialData) {
      view.pull();
    }
    return view;
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
  materialize(
    c: Comparator<T>,
    options: MaterializeOptions = { wantInitialData: true }
  ): PersistentTreeView<T> {
    return this.materializeInto(
      (stream) => new PersistentTreeView(this.materialite, stream, c),
      options
    );
  }

  materializeArray(
    c: Comparator<T>,
    options: MaterializeOptions = { wantInitialData: true }
  ): ArrayView<T> {
    return this.materializeInto(
      (stream) => new ArrayView(this.materialite, stream, c),
      options
    );
  }

  materializeCopyOnWriteArray(
    c: Comparator<T>,
    options: MaterializeOptions = { wantInitialData: true }
  ): CopyOnWriteArrayView<T> {
    return this.materializeInto(
      (stream) => new CopyOnWriteArrayView(this.materialite, stream, c),
      options
    );
  }

  materializeValue<T extends any>(
    this: AbstractDifferenceStream<T>,
    initial: T,
    options: MaterializeOptions = { wantInitialData: true }
  ): ValueView<T> {
    return this.materializeInto(
      (s) => new ValueView(this.materialite, s, initial),
      options
    );
  }

  /**
   * Run some sort of side-effect against values in the stream.
   * e.g., I/O & logging
   */
  effect(
    f: (i: Multiset<T>) => void,
    options: EffectOptions = { wantInitialData: true }
  ) {
    const ret = this.newStream<T>();
    new EffectOperator(this.writer.newReader(), ret.writer, f);
    if (options.wantInitialData) {
      ret.pull({
        expressions: [],
      });
    }
    return ret;
  }

  queueData(data: [Version, Multiset<T>]) {
    this.writer.queueData(data);
  }

  notify(v: Version) {
    // tell the writer to notify all readers
    this.writer.notify(v);
  }

  newReader() {
    return this.writer.newReader();
  }

  removeReader(
    reader: DifferenceStreamReader<T>,
    options: { autoCleanup?: boolean } = { autoCleanup: true }
  ) {
    this.writer.removeReader(reader, options);
  }

  destroy() {
    this.writer.destroy();
  }
}
