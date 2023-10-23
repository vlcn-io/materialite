import { Multiset } from "../multiset.js";
import { Version } from "../types.js";
import { IOperator } from "./ops/Operator.js";
/**
 * A read handle for a dataflow edge that receives data from a writer.
 */
export class DifferenceStreamReader<T = any> {
  protected readonly queue;
  #operator: IOperator;
  constructor(queue: [Version, Multiset<T>][]) {
    this.queue = queue;
  }

  setOperator(operator: IOperator) {
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
