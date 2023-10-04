import { Index } from ".";
import {
  Entry,
  JoinableValue,
  Multiset,
  PrimitiveValue,
  Value,
} from "./multiset";

export class CollectionSequence<T extends Value> {
  #multisets: Multiset<T>[];
  constructor(multisets: Multiset<T>[] = []) {
    this.#multisets = multisets;
  }

  push(multiset: Multiset<T>) {
    this.#multisets.push(multiset);
  }

  differenceSequence() {
    const ret: Multiset<T>[] = [];
    for (let i = 0; i < this.#multisets.length; i++) {
      if (i == 0) {
        ret.push(this.#multisets[i]!);
      } else {
        ret.push(
          this.#multisets[i]!.difference(this.#multisets[i - 1]!).consolidate()
        );
      }
    }

    return new DifferenceSequence(ret);
  }
}

export class DifferenceSequence<T extends Value> {
  #differenceSets: readonly Multiset<T>[];

  constructor(differenceSets: Multiset<T>[] = []) {
    this.#differenceSets = differenceSets;
  }

  get length() {
    return this.#differenceSets.length;
  }

  sum(): Multiset<T> {
    const collected: Entry<T>[] = [];
    for (const diff of this.#differenceSets) {
      collected.push(...diff.entires);
    }
    return new Multiset(collected).consolidate();
  }

  map<R extends Value>(fn: (value: T) => R): DifferenceSequence<R> {
    return new DifferenceSequence(this.#differenceSets.map((s) => s.map(fn)));
  }

  filter(fn: (value: T) => boolean): DifferenceSequence<T> {
    return new DifferenceSequence(
      this.#differenceSets.map((s) => s.filter(fn))
    );
  }

  negate(): DifferenceSequence<T> {
    return new DifferenceSequence(this.#differenceSets.map((s) => s.negate()));
  }

  concat(other: DifferenceSequence<T>): DifferenceSequence<T> {
    const ret = [];
    for (let i = 0; i < Math.max(this.length, other.length); ++i) {
      const a = this.#differenceSets[i] ?? new Multiset([]);
      const b = other.#differenceSets[i] ?? new Multiset([]);
      ret.push(a.concat(b));
    }
    return new DifferenceSequence(ret);
  }

  consolidate(): DifferenceSequence<T> {
    return new DifferenceSequence(
      this.#differenceSets.map((s) => s.consolidate())
    );
  }

  static join<
    K extends PrimitiveValue,
    V extends PrimitiveValue | PrimitiveValue[]
  >(
    left: DifferenceSequence<JoinableValue<K, V>>,
    right: DifferenceSequence<JoinableValue<K, V>>
  ) {
    const indexA = new Index();
    const indexB = new Index();
    const out = [];

    for (let i = 0; i < Math.max(left.length, right.length); ++i) {
      const a = left.#differenceSets[i] ?? new Multiset([]);
      const b = right.#differenceSets[i] ?? new Multiset([]);
      const deltaA = new Index();
      const deltaB = new Index();

      for (const [[key, value], multiplicity] of a.entires) {
        deltaA.add(key, [value, multiplicity]);
      }
      for (const [[key, value], multiplicity] of b.entires) {
        deltaB.add(key, [value, multiplicity]);
      }

      let result = deltaA.join(indexB);
      indexA.extend(deltaA);
      result = result.concat(indexA.join(deltaB));
      indexB.extend(deltaB);
      out.push(result.consolidate());
    }

    return new DifferenceSequence(out);
  }

  // join(other: DifferenceSequence<T>): DifferenceSequence<> {
  // const ret = [];
  // for (let i = 0; i < Math.max(this.length, other.length); ++i) {
  //   const a = this.#differenceSets[i] ?? new Multiset([]);
  //   const b = other.#differenceSets[i] ?? new Multiset([]);
  // }
  // }
}
