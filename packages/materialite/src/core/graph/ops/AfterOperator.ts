import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { LinearUnaryOperator } from "./LinearUnaryOperator.js";
import { AfterMsg } from "../Msg.js";

// Could be implemented as `filter` but `after` is able to push the operation down to the `source`.
export class AfterOperator<T> extends LinearUnaryOperator<T, T> {
  readonly #comparator;
  readonly #cursor;

  constructor(
    input: DifferenceStreamReader<T>,
    output: DifferenceStreamWriter<T>,
    v: T,
    comparator: Comparator<T>
  ) {
    const inner = (input: Multiset<T>) => {
      return input.filter((x) => comparator(x, v) >= 0);
    };
    super(input, output, inner);
    this.#comparator = comparator;
    this.#cursor = v;
  }

  getMsgForUpstream(): AfterMsg<T> {
    return {
      _tag: "after",
      cursor: this.#cursor,
      comparator: this.#comparator,
    };
  }
}
