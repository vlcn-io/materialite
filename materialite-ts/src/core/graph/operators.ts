import { TuplableMap } from "@vlcn.io/datastructures-and-algos/TuplableMap";
import { Index } from "..";
import { Entry, JoinableValue, Multiset, PrimitiveValue } from "../multiset";
import { Version } from "../types";
import {
  BinaryOperator,
  DifferenceStreamReader,
  DifferenceStreamWriter,
  UnaryOperator,
} from "./graph";
import {
  Tuple,
  Tuple2,
  TupleVariadic,
  makeTuple2,
} from "@vlcn.io/datastructures-and-algos/tuple";

export class LinearUnaryOperator<I, O> extends UnaryOperator<I, O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    f: (input: Multiset<I>) => Multiset<O>
  ) {
    const inner = (version: Version) => {
      for (const collection of this.inputMessages(version)) {
        this.output.sendData(version, f(collection));
      }
    };
    super(input, output, inner);
  }
}

export class MapOperator<I, O> extends LinearUnaryOperator<I, O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    f: (input: I) => O
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.map(f);
    };
    super(input, output, inner);
  }
}

export class FilterOperator<I> extends LinearUnaryOperator<I, I> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>,
    f: (input: I) => boolean
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.filter(f);
    };
    super(input, output, inner);
  }
}

export class NegateOperator<I> extends LinearUnaryOperator<I, I> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.negate();
    };
    super(input, output, inner);
  }
}

export class ConcatOperator<I1, I2> extends BinaryOperator<I1, I2, I1 | I2> {
  #inputAPending: Multiset<I1>[] = [];
  #inputBPending: Multiset<I2>[] = [];

  constructor(
    input1: DifferenceStreamReader<I1>,
    input2: DifferenceStreamReader<I2>,
    output: DifferenceStreamWriter<I1 | I2>
  ) {
    const inner = (version: Version) => {
      for (const collection of this.inputAMessages(version)) {
        this.#inputAPending.push(collection);
      }
      for (const collection of this.inputBMessages(version)) {
        this.#inputBPending.push(collection);
      }

      while (this.#inputAPending.length > 0 && this.#inputBPending.length > 0) {
        const a = this.#inputAPending.shift();
        const b = this.#inputBPending.shift();
        this.output.sendData(version, a!.concat(b!));
      }
    };
    super(input1, input2, output, inner);
  }
}

export class JoinOperator<K, V1, V2> extends BinaryOperator<
  JoinableValue<K, V1>,
  JoinableValue<K, V2>,
  JoinableValue<K, Tuple<V1 | V2>>
> {
  readonly #indexA = new Index<K, V1>();
  readonly #indexB = new Index<K, V2>();
  readonly #inputAPending: Index<K, V1>[] = [];
  readonly #inputBPending: Index<K, V2>[] = [];

  constructor(
    inputA: DifferenceStreamReader<JoinableValue<K, V1>>,
    inputB: DifferenceStreamReader<JoinableValue<K, V2>>,
    output: DifferenceStreamWriter<JoinableValue<K, TupleVariadic<[V1, V2]>>>
  ) {
    const inner = (version: Version) => {
      for (const collection of this.inputAMessages(version)) {
        const deltaA = new Index<K, V1>();
        for (const [[key, value], mult] of collection.entries) {
          deltaA.add(key, [value, mult]);
        }
        this.#inputAPending.push(deltaA);
      }

      for (const collection of this.inputBMessages(version)) {
        const deltaB = new Index<K, V2>();
        for (const [[key, value], mult] of collection.entries) {
          deltaB.add(key, [value, mult]);
        }
        this.#inputBPending.push(deltaB);
      }

      // TODO: join should still be able to operate even if one of the inputs is empty...
      // right?
      while (this.#inputAPending.length > 0 && this.#inputBPending.length > 0) {
        const result = new Multiset<JoinableValue<K, readonly (V1 | V2)[]>>([]);
        const deltaA = this.#inputAPending.shift()!;
        const deltaB = this.#inputBPending.shift()!;

        result._extend(deltaA.join(this.#indexB));
        this.#indexA.extend(deltaA);
        result._extend(this.#indexA.join(deltaB));
        this.#indexB.extend(deltaB);

        this.output.sendData(version, result.consolidate() as any);
        this.#indexA.compact();
        this.#indexB.compact();
      }
    };
    super(inputA, inputB, output, inner);
  }
}

export class ReduceOperator<
  K extends PrimitiveValue,
  V,
  O = V
> extends UnaryOperator<JoinableValue<K, V>, JoinableValue<K, O>> {
  readonly #index = new Index<K, V>();
  readonly #indexOut = new Index<K, O>();

  constructor(
    input: DifferenceStreamReader<JoinableValue<K, V>>,
    output: DifferenceStreamWriter<JoinableValue<K, O>>,
    f: (input: Entry<V>[]) => Entry<O>[]
  ) {
    const subtractValues = (first: Entry<O>[], second: Entry<O>[]) => {
      const result = new TuplableMap<O, number>();
      for (const [v1, m1] of first) {
        const sum = (result.get(v1) || 0) + m1;
        if (sum === 0) {
          result.delete(v1);
        } else {
          result.set(v1, sum);
        }
      }
      for (const [v2, m2] of second) {
        const sum = (result.get(v2) || 0) - m2;
        if (sum === 0) {
          result.delete(v2);
        } else {
          result.set(v2, sum);
        }
      }

      return result.entries();
    };
    const inner = (version: Version) => {
      for (const collection of this.inputMessages(version)) {
        const keysTodo = new Set<K>();
        const result: [Tuple2<K, O>, number][] = [];
        for (const [[key, value], mult] of collection.entries) {
          this.#index.add(key, [value, mult]);
          keysTodo.add(key);
        }
        for (const key of keysTodo) {
          const curr = this.#index.get(key);
          const currOut = this.#indexOut.get(key);
          const out = f(curr);
          const delta = subtractValues(out, currOut);
          for (const [value, mult] of delta) {
            result.push([makeTuple2([key, value]), mult]);
            this.#indexOut.add(key, [value, mult]);
          }
        }
        this.output.sendData(version, new Multiset(result));
        const keys = [...keysTodo.values()];
        this.#index.compact(keys);
        this.#indexOut.compact(keys);
      }
    };
    super(input, output, inner);
  }
}

export class CountOperator<K extends PrimitiveValue, V> extends ReduceOperator<
  K,
  V,
  number
> {
  constructor(
    input: DifferenceStreamReader<JoinableValue<K, V>>,
    output: DifferenceStreamWriter<JoinableValue<K, number>>
  ) {
    const inner = (vals: Entry<V>[]): [Entry<number>] => {
      let count = 0;
      for (const [_, mult] of vals) {
        count += mult;
      }
      return [[count, 1]];
    };
    super(input, output, inner);
  }
}

// TODO: linear reduce that does not require an index!
// E.g., count can just sum over stream without remembering old values

export class DebugOperator extends UnaryOperator<any, any> {
  constructor(
    input: DifferenceStreamReader<any>,
    output: DifferenceStreamWriter<any>,
    f: (input: Multiset<any>) => void
  ) {
    const inner = (version: Version) => {
      for (const collection of this.inputMessages(version)) {
        f(collection);
      }
    };
    super(input, output, inner);
  }
}
