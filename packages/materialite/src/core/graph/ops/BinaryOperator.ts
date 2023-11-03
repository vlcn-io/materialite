import { Multiset } from "../../multiset.js";
import { EventMetadata, Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { Operator } from "./Operator.js";

export class BinaryOperator<I1, I2, O> extends Operator<O> {
  constructor(
    input1: DifferenceStreamReader<I1>,
    input2: DifferenceStreamReader<I2>,
    output: DifferenceStreamWriter<O>,
    fn: (e: EventMetadata) => void
  ) {
    super([input1, input2], output, fn);
  }

  inputAMessages(version: Version) {
    return (this.inputs[0]?.drain(version) ?? []) as Multiset<I1>[];
  }

  inputBMessages(version: Version) {
    return (this.inputs[1]?.drain(version) ?? []) as Multiset<I2>[];
  }
}
