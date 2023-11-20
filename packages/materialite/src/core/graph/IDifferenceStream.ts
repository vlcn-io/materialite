import { Entry } from "../multiset.js";
import { JoinResultVariadic } from "@vlcn.io/ds-and-algos/tuple";
import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { ValueView } from "../../views/PrimitiveView.js";
import { PersistentTreeView } from "../../views/PersistentTreeView.js";
import { View } from "../../views/View.js";
import { CopyOnWriteArrayView } from "../../views/CopyOnWriteArrayView.js";
import { ArrayView } from "../../views/ArrayView.js";

export type MaterializeOptions = {
  wantInitialData?: boolean;
  limit?: number;
};
export type EffectOptions = MaterializeOptions;

export interface IDifferenceStream<T> {
  after(v: T, comparator: Comparator<T>): IDifferenceStream<T>;
  take(n: number, comparator: Comparator<T>): IDifferenceStream<T>;
  map<O>(f: (value: T) => O): IDifferenceStream<O>;
  filter(f: (x: T) => boolean): IDifferenceStream<T>;
  negate(): IDifferenceStream<T>;
  concat<T2>(other: IDifferenceStream<T2>): IDifferenceStream<T | T2>;
  join<K, R>(
    other: IDifferenceStream<R>,
    getKeyThis: (i: T) => K,
    getKeyOther: (i: R) => K
  ): IDifferenceStream<
    T extends JoinResultVariadic<[infer T1, ...infer T2]>
      ? JoinResultVariadic<[T1, ...T2, R]>
      : JoinResultVariadic<[T, R]>
  >;
  // TODO: implement a reduce that doesn't expose `Entry`
  reduce<K, O>(
    fn: (i: Entry<T>[]) => Entry<O>[],
    getKey: (i: T) => K
  ): IDifferenceStream<O>;
  count<K>(getKey: (i: T) => K): IDifferenceStream<number>;
  size(): IDifferenceStream<number>;
  effect(f: (i: T) => void, options: EffectOptions): IDifferenceStream<T>;

  materializeInto<T extends View<V, VC>, V, VC>(
    ctor: (stream: this) => T,
    options: MaterializeOptions
  ): T;
  materialize(
    c: Comparator<T>,
    options: MaterializeOptions
  ): PersistentTreeView<T>;
  materializeValue<T>(
    this: IDifferenceStream<T>,
    initial: T,
    options: MaterializeOptions
  ): ValueView<T>;
  materializeCopyOnWriteArray(
    c: Comparator<T>,
    options: MaterializeOptions
  ): CopyOnWriteArrayView<T>;
  materializeArray(c: Comparator<T>, options: MaterializeOptions): ArrayView<T>;
}
