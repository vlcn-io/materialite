import { Multiset } from "../multiset.js";
import { Version } from "../types.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { Msg } from "./Msg.js";
import { IOperator } from "./ops/Operator.js";
/**
 * A read handle for a dataflow edge that receives data from a writer.
 */
export class DifferenceStreamReader<T = any> {
  protected readonly queue;
  readonly #upstream: DifferenceStreamWriter<T>;
  #operator: IOperator;
  constructor(
    upstream: DifferenceStreamWriter<T>,
    queue: [Version, Multiset<T>][]
  ) {
    this.queue = queue;
    this.#upstream = upstream;
  }

  destroy() {
    this.#upstream.removeReader(this);
    this.queue.length = 0;
  }

  setOperator(operator: IOperator) {
    if (this.#operator != null) {
      throw new Error("Operator already set!");
    }
    this.#operator = operator;
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

  pull(msg: Msg) {
    // TODO: reset queue?
    this.#upstream.pull(msg);
  }

  get length() {
    return this.queue.length;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

export class DifferenceStreamReaderFromRoot<
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
