import { Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { LinearUnaryOperator } from "./LinearUnaryOperator.js";

export class NegateOperator<I> extends LinearUnaryOperator<I, I> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.negate();
    };
    super(input, output, inner);
  }
}
