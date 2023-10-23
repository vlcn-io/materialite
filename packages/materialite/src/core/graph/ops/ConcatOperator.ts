import { Multiset } from "../../multiset.js";
import { Version } from "../../types.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { BinaryOperator } from "./BinaryOperator.js";

export class ConcatOperator<I1, I2> extends BinaryOperator<I1, I2, I1 | I2> {
  #inputAPending: Multiset<I1>[] = [];
  #inputBPending: Multiset<I2>[] = [];

  constructor(
    input1: DifferenceStreamReader<I1>,
    input2: DifferenceStreamReader<I2>,
    output: DifferenceStreamWriter<I1 | I2>
  ) {
    const inner = (version: Version) => {
      for (const collection of this.inputAMessages(version)) {
        this.#inputAPending.push(collection);
      }
      for (const collection of this.inputBMessages(version)) {
        this.#inputBPending.push(collection);
      }

      while (this.#inputAPending.length > 0 && this.#inputBPending.length > 0) {
        const a = this.#inputAPending.shift();
        const b = this.#inputBPending.shift();
        this.output.sendData(version, a!.concat(b!));
      }
    };
    super(input1, input2, output, inner);
  }
}
