import { Multiset } from "../../multiset.js";
import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { Operator } from "./Operator.js";

export class UnaryOperator<I, O> extends Operator<O> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<O>,
    fn: (e: Version) => void
  ) {
    super([input], output, fn);
  }

  inputMessages(version: Version) {
    return (this.inputs[0]?.drain(version) ?? []) as Multiset<I>[];
  }
}
