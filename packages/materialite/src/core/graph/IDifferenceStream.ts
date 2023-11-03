import { Entry, Multiset, PrimitiveValue } from "../multiset.js";
import { PersistentTreeView, PrimitiveView } from "../../index.js";
import { JoinResultVariadic } from "@vlcn.io/ds-and-algos/tuple";
import { Comparator } from "@vlcn.io/ds-and-algos/types";

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
  effect(f: (i: Multiset<T>) => void): IDifferenceStream<T>;

  materializeInto<T>(ctor: (stream: this) => T): T;
  materialize(c: Comparator<T>): PersistentTreeView<T>;
  materializePrimitive<T extends PrimitiveValue>(
    this: IDifferenceStream<T>,
    initial: T
  ): PrimitiveView<T>;
}
