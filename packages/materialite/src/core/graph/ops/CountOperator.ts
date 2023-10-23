import { Entry } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
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
