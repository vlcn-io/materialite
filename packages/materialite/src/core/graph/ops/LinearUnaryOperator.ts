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
    const inner = (version: Version) => {
      for (const collection of this.inputMessages(version)) {
        this.output.sendData(version, f(collection));
      }
    };
    super(input, output, inner);
  }
}
