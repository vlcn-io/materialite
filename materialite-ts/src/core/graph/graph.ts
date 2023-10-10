import { Multiset } from "../multiset";
import { Version } from "../types";
/**
 * A read handle for a dataflow edge that receives data from a writer.
 */
export class DifferenceStreamReader<T = any> {
  protected readonly queue;
  readonly #operator: Operator<T>;
  constructor(queue: [Version, Multiset<T>][]) {
    this.queue = queue;
  }

  notify(version: Version) {
    this.#operator.run(version);
  }

  drain(version: Version) {
    const ret: Multiset<T>[] = [];
    while (this.queue.length > 0 && this.queue[0]![0] === version) {
      ret.push(this.queue.shift()![1]);
    }
    return ret;
  }

  get length() {
    return this.queue.length;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

export class DifferenceStreamRederFromRoot<
  T
> extends DifferenceStreamReader<T> {
  drain(version: Version) {
    if (this.queue.length === 0) {
      return [new Multiset<T>([])];
    } else {
      return super.drain(version);
    }
  }
}

/**
 * Write handle
 */
export class DifferenceStreamWriter<T> {
  readonly queues: [Version, Multiset<T>][][] = [];
  readonly readers: DifferenceStreamReader<T>[] = [];

  // prepares data but does not yet send it to readers
  queueData(data: [Version, Multiset<T>]) {
    for (const q of this.queues) {
      q.push(data);
    }
  }

  // queues data and notifies readers
  sendData(version: Version, data: Multiset<T>) {
    this.queueData([version, data]);
    this.notify(version);
  }

  notify(version: Version) {
    for (const r of this.readers) {
      r.notify(version);
    }
  }

  newReader() {
    const queue: [Version, Multiset<T>][] = [];
    this.queues.push(queue);
    const reader = new DifferenceStreamReader(queue);
    this.readers.push(reader);
    return reader;
  }
}

export class RootDifferenceStreamWriter<T> extends DifferenceStreamWriter<T> {
  newReader() {
    const queue: [Version, Multiset<T>][] = [];
    this.queues.push(queue);
    const reader = new DifferenceStreamRederFromRoot(queue);
    this.readers.push(reader);
    return reader;
  }
}

/**
 * A dataflow operator (node) that has many incoming edges (read handles) and one outgoing edge (write handle).
 */
export class Operator<O> {
  readonly #fn;
  protected _pendingWork: boolean = false;

  constructor(
    protected readonly inputs: DifferenceStreamReader[],
    protected readonly output: DifferenceStreamWriter<O>,
    fn: (version: Version) => void
  ) {
    this.#fn = fn;
  }

  run(version: Version) {
    this.#fn(version);
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

export class UnaryOperator<I, O> extends Operator<O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    fn: (version: Version) => void
  ) {
    super([input], output, fn);
  }

  inputMessages(version: Version) {
    return (this.inputs[0]?.drain(version) ?? []) as Multiset<I>[];
  }
}

export class BinaryOperator<I1, I2, O> extends Operator<O> {
  constructor(
    input1: DifferenceStreamReader<I1>,
    input2: DifferenceStreamReader<I2>,
    output: DifferenceStreamWriter<O>,
    fn: (version: Version) => void
  ) {
    super([input1, input2], output, fn);
  }

  inputAMessages(version: Version) {
    return (this.inputs[0]?.drain(version) ?? []) as Multiset<I1>[];
  }

  inputBMessages(version: Version) {
    return (this.inputs[1]?.drain(version) ?? []) as Multiset<I2>[];
  }
}
