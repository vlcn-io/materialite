import { Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { LinearUnaryOperator } from "./LinearUnaryOperator.js";

export class FilterOperator<I> extends LinearUnaryOperator<I, I> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>,
    f: (input: I) => boolean
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.filter(f);
    };
    super(input, output, inner);
  }
}
