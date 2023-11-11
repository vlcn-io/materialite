import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { Hoisted } from "../Msg.js";

export interface IOperator {
  run(version: Version): void;
  pull(msg: Hoisted): void;
  destroy(): void;
  notifyCommitted(v: Version): void;
}
/**
 * A dataflow operator (node) that has many incoming edges (read handles) and one outgoing edge (write handle).
 */
export class Operator<O> implements IOperator {
  readonly #fn;
  protected _pendingWork: boolean = false;

  constructor(
    protected readonly inputs: DifferenceStreamReader[],
    protected readonly output: DifferenceStreamWriter<O>,
    fn: (v: Version) => void
  ) {
    this.#fn = fn;
    for (const input of inputs) {
      input.setOperator(this);
    }
    this.output.setOperator(this);
  }

  run(v: Version) {
    this.#fn(v);
  }

  notifyCommitted(v: Version) {
    this.output.notifyCommitted(v);
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

  /**
   * If an operator is pulled, it sends the pull
   * up the stream to its inputs.
   * @param msg
   * @returns
   */
  pull(msg: Hoisted) {
    for (const input of this.inputs) {
      input.pull(msg);
    }
  }

  destroy(): void {
    for (const input of this.inputs) {
      input.destroy();
    }
  }
}
