import { Index } from "..";
import { TMap } from "../collections/TMap";
import {
  Entry,
  JoinableValue,
  Multiset,
  PrimitiveValue,
  Value,
} from "../multiset";
import {
  BinaryOperator,
  DifferenceStreamReader,
  DifferenceStreamWriter,
  Graph,
  Operator,
  UnaryOperator,
} from "./graph";

export class DifferenceStreamBuilder<T extends Value> {
  readonly #writer;
  readonly #graph;

  constructor(graph: GraphBuilder) {
    this.#writer = new DifferenceStreamWriter<T>();
    this.#graph = graph;
  }

  connectReader() {
    return this.#writer.newReader();
  }

  get writer() {
    return this.#writer;
  }

  map(f: any) {}
}

export class GraphBuilder {
  readonly #operators: Operator<any>[] = [];

  newInput() {
    const streamBuilder = new DifferenceStreamBuilder(this);
    return [streamBuilder, streamBuilder.writer] as const;
  }

  addOperator(operator: Operator<any>) {
    this.#operators.push(operator);
  }

  build() {
    return new Graph(this.#operators);
  }
}

export class LinearUnaryOperator<
  I extends Value,
  O extends Value
> extends UnaryOperator<I, O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    f: (input: Multiset<I>) => Multiset<O>
  ) {
    const inner = () => {
      for (const collection of this.inputMessages) {
        this.output.sendData(f(collection));
      }
    };
    super(input, output, inner);
  }
}

export class MapOperator<
  I extends Value,
  O extends Value
> extends LinearUnaryOperator<I, O> {
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

export class FilterOperator<I extends Value> extends LinearUnaryOperator<I, I> {
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

export class NegateOperator<I extends Value> extends LinearUnaryOperator<I, I> {
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

export class ConcatOperator<
  I1 extends Value,
  I2 extends Value
> extends BinaryOperator<I1, I2, I1 | I2> {
  #inputAPending: Multiset<I1>[] = [];
  #inputBPending: Multiset<I2>[] = [];

  constructor(
    input1: DifferenceStreamReader<I1>,
    input2: DifferenceStreamReader<I2>,
    output: DifferenceStreamWriter<I1 | I2>
  ) {
    const inner = () => {
      for (const collection of this.inputAMessages) {
        this.#inputAPending.push(collection);
      }
      for (const collection of this.inputBMessages) {
        this.#inputBPending.push(collection);
      }

      while (this.#inputAPending.length > 0 && this.#inputBPending.length > 0) {
        const a = this.#inputAPending.shift();
        const b = this.#inputBPending.shift();
        this.output.sendData(a!.concat(b!));
      }
    };
    super(input1, input2, output, inner);
  }
}

export class JoinOperator<
  K extends PrimitiveValue,
  V1 extends Value,
  V2 extends Value = V1
> extends BinaryOperator<
  JoinableValue<K, V1>,
  JoinableValue<K, V2>,
  [K, [V1, V2]]
> {
  readonly #indexA = new Index<K, V1>();
  readonly #indexB = new Index<K, V2>();
  readonly #inputAPending: Index<K, V1>[] = [];
  readonly #inputBPending: Index<K, V2>[] = [];

  constructor(
    inputA: DifferenceStreamReader<JoinableValue<K, V1>>,
    inputB: DifferenceStreamReader<JoinableValue<K, V2>>,
    output: DifferenceStreamWriter<[K, [V1, V2]]>
  ) {
    const inner = () => {
      for (const collection of this.inputAMessages) {
        const deltaA = new Index<K, V1>();
        for (const [[key, value], mult] of collection.entries) {
          deltaA.add(key, [value, mult]);
        }
        this.#inputAPending.push(deltaA);
      }

      for (const collection of this.inputBMessages) {
        const deltaB = new Index<K, V2>();
        for (const [[key, value], mult] of collection.entries) {
          deltaB.add(key, [value, mult]);
        }
        this.#inputBPending.push(deltaB);
      }

      while (this.#inputAPending.length > 0 && this.#inputBPending.length > 0) {
        const result = new Multiset<JoinableValue<K, readonly [V1, V2]>>([]);
        const deltaA = this.#inputAPending.shift()!;
        const deltaB = this.#inputBPending.shift()!;

        result._extend(deltaA.join(this.#indexB));
        this.#indexA.extend(deltaA);
        result._extend(this.#indexA.join(deltaB));
        this.#indexB.extend(deltaB);

        this.output.sendData(result.consolidate() as any);
        this.#indexA.compact();
        this.#indexB.compact();
      }
    };
    super(inputA, inputB, output, inner);
  }
}

// Reduce operator should require key-value pair data.
export class ReduceOperator<
  K extends PrimitiveValue,
  V extends Value,
  O extends Value = V
> extends UnaryOperator<JoinableValue<K, V>, JoinableValue<K, O>> {
  readonly #indexA = new Index<K, V>();
  readonly #indexOut = new Index<K, O>();

  constructor(
    input: DifferenceStreamReader<JoinableValue<K, V>>,
    output: DifferenceStreamWriter<JoinableValue<K, O>>,
    f: (input: Multiset<JoinableValue<K, V>>) => Multiset<JoinableValue<K, O>>
  ) {
    const subtractValues = (first: [O, number], second: [O, number]) => {
      const result = new TMap();
    };
    const inner = () => {};
    super(input, output, inner);
  }
}
