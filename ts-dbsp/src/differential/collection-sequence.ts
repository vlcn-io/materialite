import { Entry, Multiset } from "./multiset";

export class CollectionSequence {
  #multisets: Multiset[];
  constructor(multisets: Multiset[] = []) {
    this.#multisets = multisets;
  }

  push(multiset: Multiset) {
    this.#multisets.push(multiset);
  }

  differenceSequence() {
    const ret: Multiset[] = [];
    for (let i = 0; i < this.#multisets.length; i++) {
      if (i == 0) {
        ret.push(this.#multisets[i]!)
      } else {
        ret.push(this.#multisets[i]!.difference(this.#multisets[i - 1]!).consolidate());
      }
    }

    return new DifferenceCollectionSequence(ret);
  }
}

export class DifferenceCollectionSequence {
  #differenceSets: Multiset[];

  constructor(differenceSets: Multiset[] = []) {
    this.#differenceSets = differenceSets;
  }

  sum() {
    const collected: Entry[] = [];
    for (const diff of this.#differenceSets) {
      collected.push(...diff.entires);
    }
    return new Multiset(collected).consolidate();
  }
}
