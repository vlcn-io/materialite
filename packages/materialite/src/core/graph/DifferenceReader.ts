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
  #lastSeenVersion: Version = -1;
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
    this.#lastSeenVersion = v;
    this.#operator.run(v);
  }

  notifyCommitted(v: Version) {
    // If we did not process this version in this oeprator
    // then we should not pass notifications down this path.
    if (v !== this.#lastSeenVersion) {
      return;
    }
    this.#operator.notifyCommitted(v);
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
    this.queue.prepareForRecompute();
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
      return [new Multiset<T>([], null)];
    } else {
      return super.drain(version);
    }
  }
}
