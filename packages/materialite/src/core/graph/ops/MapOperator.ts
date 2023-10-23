import { Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { LinearUnaryOperator } from "./LinearUnaryOperator.js";

export class MapOperator<I, O> extends LinearUnaryOperator<I, O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    f: (input: I) => O
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.map(f);
    };
    super(input, output, inner);
  }
}
