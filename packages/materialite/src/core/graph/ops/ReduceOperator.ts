import { Index } from "../../index.js";
import { Entry, Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { UnaryOperator } from "./UnaryOperator.js";
import { Version } from "../../types.js";
import { TuplableMap } from "@vlcn.io/ds-and-algos/TuplableMap";

export class ReduceOperator<K, V, O = V> extends UnaryOperator<V, O> {
  readonly #index = new Index<K, V>();
  readonly #indexOut = new Index<K, O>();

  constructor(
    input: DifferenceStreamReader<V>,
    output: DifferenceStreamWriter<O>,
    getKey: (value: V) => K,
    f: (input: Entry<V>[]) => Entry<O>[]
  ) {
    // TODO: deal with full recompute messages
    const subtractValues = (first: Entry<O>[], second: Entry<O>[]) => {
      const result = new TuplableMap<O, number>();
      for (const [v1, m1] of first) {
        const sum = (result.get(v1) || 0) + m1;
        if (sum === 0) {
          result.delete(v1);
        } else {
          result.set(v1, sum);
        }
      }
      for (const [v2, m2] of second) {
        const sum = (result.get(v2) || 0) - m2;
        if (sum === 0) {
          result.delete(v2);
        } else {
          result.set(v2, sum);
        }
      }

      return result.entries();
    };
    const inner = (version: Version) => {
      for (const collection of this.inputMessages(version)) {
        const keysTodo = new Set<K>();
        const result: [O, number][] = [];
        for (const [value, mult] of collection.entries) {
          const key = getKey(value);
          this.#index.add(key, [value, mult]);
          keysTodo.add(key);
        }
        for (const key of keysTodo) {
          const curr = this.#index.get(key);
          const currOut = this.#indexOut.get(key);
          const out = f(curr);
          const delta = subtractValues(out, currOut);
          for (const [value, mult] of delta) {
            result.push([value, mult]);
            this.#indexOut.add(key, [value, mult]);
          }
        }
        this.output.sendData(version, new Multiset(result, null));
        const keys = [...keysTodo.values()];
        this.#index.compact(keys);
        this.#indexOut.compact(keys);
      }
    };
    super(input, output, inner);
  }
}
