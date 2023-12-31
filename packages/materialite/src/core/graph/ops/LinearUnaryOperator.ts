import { Multiset } from "../../multiset.js";
import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { UnaryOperator } from "./UnaryOperator.js";

export class LinearUnaryOperator<I, O> extends UnaryOperator<I, O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    f: (input: Multiset<I>) => Multiset<O>
  ) {
    const inner = (v: Version) => {
      for (const collection of this.inputMessages(v)) {
        this.output.sendData(v, f(collection));
      }
    };
    super(input, output, inner);
  }
}
