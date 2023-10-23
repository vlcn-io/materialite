import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";

export interface IOperator {
  run(version: Version): void;
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
