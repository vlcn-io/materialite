import { Multiset, Value } from "../multiset";
import { Version } from "../types";
/**
 * A read handle for a dataflow edge that receives data from a writer.
 */
export class DifferenceStreamReader<T extends Value = any> {
  readonly #queue;
  readonly #operator: Operator<T>;
  constructor(queue: [Version, Multiset<T>][]) {
    this.#queue = queue;
  }

  notify(version: Version) {
    this.#operator.run(version);
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
  readonly #readers: DifferenceStreamReader<T>[] = [];

  // prepares data but does not yet send it to readers
  queueData(data: [Version, Multiset<T>]) {
    for (const q of this.#queues) {
      q.push(data);
    }
  }

  // queues data and notifies readers
  // we gots a problem. Middle nodes will need to await data.
  // rather than optimistic pull. It might not be calculated yet if we optimistic pull.
  // We could make our way through the graph in a breadth first way.
  // 1. `DirtySources` are roots
  // 2. Go through each telling them to run
  // 3. Then visit their children and so on...
  // Each level will be ready. Well what if a low level feeds into a high level? This doesn't work.
  // We do need some sort of frontiering and versions I suppose.
  sendData(data: Multiset<T>) {}

  notify(version: Version) {
    for (const r of this.#readers) {
      r.notify(version);
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
