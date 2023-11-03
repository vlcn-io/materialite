import { Multiset } from "../../multiset.js";
import { EventMetadata } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { UnaryOperator } from "./UnaryOperator.js";

export class DebugOperator extends UnaryOperator<any, any> {
  constructor(
    input: DifferenceStreamReader<any>,
    output: DifferenceStreamWriter<any>,
    f: (input: Multiset<any>) => void
  ) {
    const inner = (e: EventMetadata) => {
      for (const collection of this.inputMessages(e.version)) {
        f(collection);
        this.output.sendData(e.version, collection);
      }
    };
    super(input, output, inner);
  }
}
