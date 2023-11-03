import { Entry, Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { LinearUnaryOperator } from "./LinearUnaryOperator.js";
import { ReduceOperator } from "./ReduceOperator.js";

// TODO: count is technically linear. We can do this as a linear operator so as not to require
// retaining values. Maybe add `LinearReduceOperator`?
export class CountOperator<K, V> extends ReduceOperator<K, V, number> {
  constructor(
    input: DifferenceStreamReader<V>,
    output: DifferenceStreamWriter<number>,
    getKey: (value: V) => K
  ) {
    const inner = (vals: Entry<V>[]): [Entry<number>] => {
      let count = 0;
      for (const [_, mult] of vals) {
        count += mult;
      }
      return [[count, 1]];
    };
    super(input, output, getKey, inner);
  }
}

export class LinearCountOperator<V> extends LinearUnaryOperator<V, number> {
  #state: number = 0;
  constructor(
    input: DifferenceStreamReader<V>,
    output: DifferenceStreamWriter<number>
  ) {
    const inner = (collection: Multiset<V>) => {
      if (collection.eventMetadata?.cause === "full_recompute") {
        this.#state = 0;
      }

      for (const e of collection.entries) {
        this.#state += e[1];
      }
      return new Multiset([[this.#state, 1]], collection.eventMetadata);
    };
    super(input, output, inner);
  }
}
