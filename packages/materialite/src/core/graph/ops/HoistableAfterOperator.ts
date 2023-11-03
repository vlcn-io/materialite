import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { AfterMsg, Msg } from "../Msg.js";
import { AfterOperator } from "./AfterOperator.js";

// Could be implemented as `filter` but `after` is able to push the operation down to the `source`.
export class HoistableAfterOperator<T> extends AfterOperator<T> {
  readonly #comparator;
  readonly #cursor;

  constructor(
    input: DifferenceStreamReader<T>,
    output: DifferenceStreamWriter<T>,
    v: T,
    comparator: Comparator<T>
  ) {
    super(input, output, v, comparator);
    this.#comparator = comparator;
    this.#cursor = v;
  }

  pull(msg: Msg) {
    const extra: AfterMsg<T> = {
      _tag: "after",
      cursor: this.#cursor,
      comparator: this.#comparator,
    };
    msg.operatorMessages.push(extra);
    super.pull(msg);
  }
}
