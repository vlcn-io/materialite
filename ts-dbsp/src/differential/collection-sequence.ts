import { Entry, Multiset, Value } from "./multiset";

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

  // join(other: DifferenceSequence<T>): DifferenceSequence<> {
  // const ret = [];
  // for (let i = 0; i < Math.max(this.length, other.length); ++i) {
  //   const a = this.#differenceSets[i] ?? new Multiset([]);
  //   const b = other.#differenceSets[i] ?? new Multiset([]);
  // }
  // }
}
