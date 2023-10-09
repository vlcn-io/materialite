import { Multiset } from "../multiset";
import { Version } from "../types";
import {
  DifferenceStreamReader,
  DifferenceStreamWriter,
  UnaryOperator,
} from "./graph";

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

export class FilterOperator<I> extends LinearUnaryOperator<I, I> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>,
    f: (input: I) => boolean
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.filter(f);
    };
    super(input, output, inner);
  }
}

export class NegateOperator<I> extends LinearUnaryOperator<I, I> {
  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>
  ) {
    const inner = (collection: Multiset<I>) => {
      return collection.negate();
    };
    super(input, output, inner);
  }
}
