import { Index } from "..";
import { inspect } from "../../inspect";
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
type TODO = any;

export class DifferenceStreamBuilder<I extends Value> {
  readonly #writer;
  readonly #graph;

  constructor(graph: GraphBuilder) {
    this.#writer = new DifferenceStreamWriter<I>();
    this.#graph = graph;
  }

  connectReader() {
    return this.#writer.newReader();
  }

  get writer() {
    return this.#writer;
  }

  map<O extends Value>(f: (x: I) => O) {
    const output = new DifferenceStreamBuilder<O>(this.#graph);
    const operator = new MapOperator<I, O>(
      this.connectReader(),
      output.writer,
      f
    );
    this.#graph.addOperator(operator);
    return output;
  }

  filter(f: (x: I) => boolean) {
    const output = new DifferenceStreamBuilder<I>(this.#graph);
    const operator = new FilterOperator<I>(
      this.connectReader(),
      output.writer,
      f
    );
    this.#graph.addOperator(operator);
    return output;
  }

  negate() {
    const output = new DifferenceStreamBuilder<I>(this.#graph);
    const operator = new NegateOperator<I>(this.connectReader(), output.writer);
    this.#graph.addOperator(operator);
    return output;
  }

  concat(other: DifferenceStreamBuilder<I>) {
    const output = new DifferenceStreamBuilder<I>(this.#graph);
    const operator = new ConcatOperator<I, I>(
      this.connectReader(),
      other.connectReader(),
      output.writer
    );
    this.#graph.addOperator(operator);
    return output;
  }

  // TODO: better typings for join...
  join(other: DifferenceStreamBuilder<any>) {
    const output = new DifferenceStreamBuilder(this.#graph);
    const operator = new JoinOperator(
      this.connectReader() as TODO,
      other.connectReader() as TODO,
      output.writer as TODO
    );
    this.#graph.addOperator(operator);
    return output;
  }

  // TODO: better type since this requires key-value structure
  count() {
    const output = new DifferenceStreamBuilder(this.#graph);
    const operator = new CountOperator(
      this.connectReader() as TODO,
      output.writer as TODO
    );
    this.#graph.addOperator(operator);
    return output;
  }

  reduce<O extends Value>(fn: (i: Entry<I>[]) => Entry<O>[]) {
    const output = new DifferenceStreamBuilder<O>(this.#graph);
    const operator = new ReduceOperator(
      this.connectReader() as TODO,
      output.writer as TODO,
      fn
    );
    this.#graph.addOperator(operator);
    return output;
  }

  debug(f: (i: Multiset<I>) => void) {
    const output = new DifferenceStreamBuilder<I>(this.#graph);
    const operator = new DebugOperator(this.connectReader(), output.writer, f);
    this.#graph.addOperator(operator);
    return output;
  }
}

export class GraphBuilder {
  readonly #operators: Operator<any>[] = [];

  newInput<T extends Value>() {
    const streamBuilder = new DifferenceStreamBuilder<T>(this);
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

      // TODO: join should still be able to operate even if one of the inputs is empty...
      // right?
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

export class ReduceOperator<
  K extends PrimitiveValue,
  V extends Value,
  O extends Value = V
> extends UnaryOperator<JoinableValue<K, V>, JoinableValue<K, O>> {
  readonly #index = new Index<K, V>();
  readonly #indexOut = new Index<K, O>();

  constructor(
    input: DifferenceStreamReader<JoinableValue<K, V>>,
    output: DifferenceStreamWriter<JoinableValue<K, O>>,
    f: (input: Entry<V>[]) => Entry<O>[]
  ) {
    const subtractValues = (first: Entry<O>[], second: Entry<O>[]) => {
      const result = new TMap<O, number>();
      for (const [v1, m1] of first) {
        result.set(v1, (result.get(v1) || 0) + m1);
      }
      for (const [v2, m2] of second) {
        result.set(v2, (result.get(v2) || 0) - m2);
      }

      return result.entries().filter(([_, m]) => m !== 0);
    };
    const inner = () => {
      for (const collection of this.inputMessages) {
        const keysTodo = new Set<K>();
        const result: [[K, O], number][] = [];
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
            result.push([[key, value], mult]);
            this.#indexOut.add(key, [value, mult]);
          }
        }
        this.output.sendData(new Multiset(result));
        const keys = [...keysTodo.values()];
        this.#index.compact(keys);
        this.#indexOut.compact(keys);
      }
    };
    super(input, output, inner);
  }
}

export class CountOperator<
  K extends PrimitiveValue,
  V extends Value
> extends ReduceOperator<K, V, number> {
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

export class DebugOperator extends UnaryOperator<any, any> {
  constructor(
    input: DifferenceStreamReader<any>,
    output: DifferenceStreamWriter<any>,
    f: (input: Multiset<any>) => void
  ) {
    const inner = () => {
      for (const collection of this.inputMessages) {
        f(collection);
      }
    };
    super(input, output, inner);
  }
}
