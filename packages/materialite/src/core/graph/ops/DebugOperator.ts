import { Multiset } from "../../multiset.js";
import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { UnaryOperator } from "./UnaryOperator.js";

export class EffectOperator extends UnaryOperator<any, any> {
  constructor(
    input: DifferenceStreamReader<any>,
    output: DifferenceStreamWriter<any>,
    f: (input: Multiset<any>) => void
  ) {
    const inner = (version: Version) => {
      for (const collection of this.inputMessages(version)) {
        f(collection);
        this.output.sendData(version, collection);
      }
    };
    super(input, output, inner);
  }
}
