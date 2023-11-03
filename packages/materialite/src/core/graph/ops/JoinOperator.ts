import { JoinResultVariadic } from "@vlcn.io/ds-and-algos/tuple";
import { BinaryOperator } from "./BinaryOperator.js";
import { Index } from "../../index.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { EventMetadata } from "../../types.js";
import { Multiset } from "../../multiset.js";

/**
 * TODO: improve this via randomized binary search trees?
 */
export class JoinOperator<K, V1, V2> extends BinaryOperator<
  V1,
  V2,
  JoinResultVariadic<[V1, V2]>
> {
  readonly #indexA = new Index<K, V1>();
  readonly #indexB = new Index<K, V2>();
  readonly #inputAPending: Index<K, V1>[] = [];
  readonly #inputBPending: Index<K, V2>[] = [];

  constructor(
    inputA: DifferenceStreamReader<V1>,
    inputB: DifferenceStreamReader<V2>,
    output: DifferenceStreamWriter<JoinResultVariadic<[V1, V2]>>,
    getKeyA: (value: V1) => K,
    getKeyB: (value: V2) => K
  ) {
    const inner = (e: EventMetadata) => {
      for (const collection of this.inputAMessages(e.version)) {
        const deltaA = new Index<K, V1>();
        for (const [value, mult] of collection.entries) {
          deltaA.add(getKeyA(value), [value, mult]);
        }
        this.#inputAPending.push(deltaA);
      }

      for (const collection of this.inputBMessages(e.version)) {
        const deltaB = new Index<K, V2>();
        for (const [value, mult] of collection.entries) {
          deltaB.add(getKeyB(value), [value, mult]);
        }
        this.#inputBPending.push(deltaB);
      }

      // TODO: join should still be able to operate even if one of the inputs is empty...
      // right?
      while (this.#inputAPending.length > 0 && this.#inputBPending.length > 0) {
        const result = new Multiset<JoinResultVariadic<[V1, V2]>>([]);
        const deltaA = this.#inputAPending.shift()!;
        const deltaB = this.#inputBPending.shift()!;

        result._extend(deltaA.join(this.#indexB));
        this.#indexA.extend(deltaA);
        result._extend(this.#indexA.join(deltaB));
        this.#indexB.extend(deltaB);

        this.output.sendData(e.version, result.consolidate() as any);
        this.#indexA.compact();
        this.#indexB.compact();
      }
    };
    super(inputA, inputB, output, inner);
  }
}
