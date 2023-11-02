import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { Msg, OperatorMsg } from "../Msg.js";

export interface IOperator {
  run(version: Version): void;
  pull(msg: Msg): void;
  destroy(): void;
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
    fn: (version: Version) => void
  ) {
    this.#fn = fn;
    for (const input of inputs) {
      input.setOperator(this);
    }
    this.output.setOperator(this);
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

  /**
   * If an operator is pulled, it sends the pull
   * up the stream to its inputs.
   * @param msg
   * @returns
   */
  pull(msg: Msg): OperatorMsg | null {
    for (const input of this.inputs) {
      input.pull(msg);
    }
    return null;
  }

  destroy(): void {
    for (const input of this.inputs) {
      input.destroy();
    }
  }
}
