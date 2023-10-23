import { TuplableMap } from "@vlcn.io/ds-and-algos/TuplableMap";

export type Entry<T> = readonly [T, Multiplicity];
export type Multiplicity = number;
export type PrimitiveValue = string | number | boolean | bigint;
export type JoinableValue<K, V> = readonly [K, V];

/**
 * A naive implementation of a multi-set.
 * I.e., no optimization is going on here.
 */
export class Multiset<T> {
  constructor(public readonly entries: readonly Entry<T>[]) {}

  difference(b: Multiset<T>): Multiset<T> {
    return new Multiset([...this.entries, ...b.negate().entries]);
  }

  differenceAndConsolidate(b: Multiset<T>): Multiset<T> {
    return this.difference(b).consolidate();
  }

  concat<O>(b: Multiset<O>): Multiset<T | O> {
    return new Multiset<T | O>([...this.entries, ...b.entries]);
  }

  negate(): Multiset<T> {
    return new Multiset(
      this.entries.map(([value, multiplicity]) => [value, -multiplicity])
    );
  }

  // aka normalize
  consolidate(): Multiset<T> {
    return new Multiset([...this.#toNormalizedMap()]);
  }

  map<R>(f: (value: T) => R): Multiset<R> {
    return new Multiset(
      this.entries.map(([value, multiplicity]) => [f(value), multiplicity])
    );
  }

  filter(f: (value: T) => boolean): Multiset<T> {
    return new Multiset(this.entries.filter(([value, _]) => f(value)));
  }

  iterate(f: (values: Multiset<T>) => Multiset<T>) {
    // apply f to the multiset in turn until the multiset stops changing
    // f must only be combinations of the public operations of this class
    let current: Multiset<T> = this;
    let next = f(current);
    while (!current.equals(next)) {
      current = next;
      next = f(current);
    }
  }

  equals(b: Multiset<T>): boolean {
    const a = this.#toNormalizedMap();
    const bMap = b.#toNormalizedMap();
    if (a.size !== bMap.size) {
      return false;
    }

    for (const [value, multiplicity] of a) {
      const bMultiplicity = bMap.get(value);
      if (bMultiplicity === undefined || bMultiplicity !== multiplicity) {
        return false;
      }
    }

    return true;
  }

  #toNormalizedMap(): TuplableMap<T, Multiplicity> {
    const ret = new TuplableMap<T, Multiplicity>();
    for (const [value, multiplicity] of this.entries) {
      if (multiplicity == 0) {
        continue;
      }

      const existing = ret.get(value);
      if (existing === undefined) {
        ret.set(value, multiplicity);
      } else {
        const sum = existing + multiplicity;
        if (sum === 0) {
          ret.delete(value);
        } else {
          ret.set(value, sum);
        }
      }
    }

    return ret;
  }

  toString() {
    return this.entries.toString();
  }

  _extend(other: Multiset<T>) {
    for (const e of other.entries) {
      (this.entries as Entry<T>[]).push(e);
    }
  }
}
