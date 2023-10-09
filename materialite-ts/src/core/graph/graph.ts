import { Multiset, Value } from "../multiset";
import { Version } from "../types";
/**
 * A read handle for a dataflow edge that receives data from a writer.
 */
export class DifferenceStreamReader<T extends Value = any> {
  readonly #queue;
  constructor(queue: [Version, Multiset<T>][]) {
    this.#queue = queue;
  }

  drain(version: Version) {
    if (this.#queue.length === 0) {
      // Push a dummy entry to the queue.
      // This is ok since at each db version commit all inputs
      // will either have data or intentionally not have data.
      // Nothing will be awaiting data.
      return [new Multiset<T>([])];
    }

    const ret: Multiset<T>[] = [];
    while (this.#queue.length > 0 && this.#queue[0]![0] === version) {
      ret.push(this.#queue.shift()![1]);
    }
    return ret;
  }

  get length() {
    return this.#queue.length;
  }

  isEmpty() {
    return this.#queue.length === 0;
  }
}

/**
 * Write handle
 */
export class DifferenceStreamWriter<T extends Value> {
  readonly #queues: [Version, Multiset<T>][][] = [];

  queueData(data: [Version, Multiset<T>]) {
    for (const q of this.#queues) {
      q.push(data);
    }
  }

  newReader() {
    const queue: [Version, Multiset<T>][] = [];
    this.#queues.push(queue);
    return new DifferenceStreamReader(queue);
  }
}

/**
 * A dataflow operator (node) that has many incoming edges (read handles) and one outgoing edge (write handle).
 */
export class Operator<O extends Value> {
  readonly #fn;
  protected _pendingWork: boolean = false;

  constructor(
    protected readonly inputs: DifferenceStreamReader[],
    protected readonly output: DifferenceStreamWriter<O>,
    fn: () => void
  ) {
    this.#fn = fn;
  }

  run() {
    this.#fn();
  }

  pendingWork() {
    if (this._pendingWork) {
      return true;
    }
    for (const input of this.inputs) {
      if (!input.isEmpty()) {
        return true;
      }
    }
    return false;
  }
}

export class UnaryOperator<
  I extends Value,
  O extends Value
> extends Operator<O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    fn: () => void
  ) {
    super([input], output, fn);
  }

  get inputMessages() {
    return (this.inputs[0]?.drain() ?? []) as Multiset<I>[];
  }
}

export class BinaryOperator<
  I1 extends Value,
  I2 extends Value,
  O extends Value
> extends Operator<O> {
  constructor(
    input1: DifferenceStreamReader<I1>,
    input2: DifferenceStreamReader<I2>,
    output: DifferenceStreamWriter<O>,
    fn: () => void
  ) {
    super([input1, input2], output, fn);
  }

  get inputAMessages() {
    return (this.inputs[0]?.drain() ?? []) as Multiset<I1>[];
  }

  get inputBMessages() {
    return (this.inputs[1]?.drain() ?? []) as Multiset<I2>[];
  }
}

export class Graph {
  readonly #operators;
  constructor(operators: readonly Operator<any>[]) {
    this.#operators = operators;
  }

  step() {
    for (const operator of this.#operators) {
      operator.run();
    }
  }
}
