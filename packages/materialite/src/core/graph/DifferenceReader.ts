import { Multiset } from "../multiset.js";
import { Version } from "../types.js";
import { DifferenceStreamWriter } from "./DifferenceWriter.js";
import { Hoisted } from "./Msg.js";
import { Queue } from "./Queue.js";
import { IOperator } from "./ops/Operator.js";
/**
 * A read handle for a dataflow edge that receives data from a writer.
 */
export class DifferenceStreamReader<T = any> {
  protected readonly queue;
  readonly #upstream: DifferenceStreamWriter<T>;
  #operator: IOperator;
  constructor(upstream: DifferenceStreamWriter<T>, queue: Queue<T>) {
    this.queue = queue;
    this.#upstream = upstream;
  }

  destroy() {
    this.#upstream.removeReader(this);
    this.queue.clear();
  }

  setOperator(operator: IOperator) {
    if (this.#operator != null) {
      throw new Error("Operator already set!");
    }
    this.#operator = operator;
  }

  notify(v: Version) {
    this.#operator.run(v);
  }

  drain(version: Version) {
    const ret: Multiset<T>[] = [];
    while (true) {
      const node = this.queue.peek();
      if (node == null) {
        break;
      }
      if (node.data[0] > version) {
        break;
      }
      ret.push(node.data[1]);
      this.queue.dequeue();
    }
    return ret;
  }

  pull(msg: Hoisted) {
    this.#upstream.pull(msg);
  }

  isEmpty() {
    return this.queue.isEmpty();
  }
}

export class DifferenceStreamReaderFromRoot<
  T
> extends DifferenceStreamReader<T> {
  drain(version: Version) {
    if (this.queue.isEmpty()) {
      return [new Multiset<T>([])];
    } else {
      return super.drain(version);
    }
  }
}
