import { JoinResultVariadic } from "@vlcn.io/datastructures-and-algos/tuple";
import { Entry, Multiset } from "../multiset";
import { Version } from "../types";
import { RootDifferenceStreamWriter } from "./graph";
import {
  ConcatOperator,
  CountOperator,
  DebugOperator,
  FilterOperator,
  JoinOperator,
  MapOperator,
  NegateOperator,
  ReduceOperator,
} from "./operators";

export class DifferenceStream<T> {
  readonly #writer;

  constructor(root: boolean) {
    // set write to a new difference stream writer
    if (root) {
      this.#writer = new RootDifferenceStreamWriter<T>();
    } else {
      this.#writer = new RootDifferenceStreamWriter<T>();
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
    const output = new DifferenceStream<T>(false);
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
}
