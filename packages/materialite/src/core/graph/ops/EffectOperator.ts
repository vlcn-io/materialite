import { Multiset } from "../../multiset.js";
import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { UnaryOperator } from "./UnaryOperator.js";

/**
 * Runs an effect _after_ a transaction has been committed.
 * Does not observe deleted values.
 */
export class EffectOperator<T> extends UnaryOperator<T, T> {
  readonly #f: (input: T) => void;
  #collected: Multiset<T>[] = [];

  constructor(
    input: DifferenceStreamReader<any>,
    output: DifferenceStreamWriter<any>,
    f: (input: T) => void
  ) {
    const inner = (version: Version) => {
      this.#collected = [];
      for (const collection of this.inputMessages(version)) {
        this.#collected.push(collection);
        this.output.sendData(version, collection);
      }
    };
    super(input, output, inner);
    this.#f = f;
  }

  notifyCommitted(v: number): void {
    for (const collection of this.#collected) {
      for (const [val, mult] of collection.entries) {
        if (mult > 0) {
          this.#f(val);
        }
      }
    }
    this.output.notifyCommitted(v);
  }
}
