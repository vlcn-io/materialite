import { Entry, JoinableValue, Multiset, PrimitiveValue } from "./multiset";

export class Index<
  K extends PrimitiveValue,
  V extends PrimitiveValue | PrimitiveValue[]
> {
  readonly #index = new Map<K, Entry<V>[]>();

  constructor() {}

  add(key: K, value: Entry<V>) {
    let existing = this.#index.get(key);
    if (existing === undefined) {
      existing = [];
      this.#index.set(key, existing);
    }
    existing.push(value);
  }

  extend(index: Index<K, V>) {
    for (const [key, value] of index.#index) {
      for (const entry of value) {
        this.add(key, entry);
      }
    }
  }

  get(key: K): Entry<V>[] {
    return this.#index.get(key) ?? [];
  }

  join(other: Index<K, V>): Multiset<JoinableValue> {
    const ret: (readonly [readonly [K, readonly [V, V]], number])[] = [];
    for (const [key, entry] of this.#index) {
      const otherEntry = other.#index.get(key);
      if (otherEntry === undefined) {
        continue;
      }
      for (const [v1, m1] of entry) {
        for (const [v2, m2] of otherEntry) {
          ret.push([[key, [v1, v2] as const] as const, m1 * m2] as const);
        }
      }
    }
    return new Multiset(ret);
  }

  compact(keys: K[] = []) {
    function conslidateValues(values: Entry<V>[]) {
      const consolidated = new Map<V, number>();
      for (const [value, multiplicity] of values) {
        if (multiplicity === 0) {
          continue;
        }
        const existing = consolidated.get(value);
        if (existing === undefined) {
          consolidated.set(value, multiplicity);
        } else {
          const sum = existing + multiplicity;
          if (sum === 0) {
            consolidated.delete(value);
          } else {
            consolidated.set(value, sum);
          }
        }
      }

      return [...consolidated.entries()];
    }

    const iterableKeys = keys.length != 0 ? keys : this.#index.keys();
    for (const key of iterableKeys) {
      const entries = this.#index.get(key);
      if (entries === undefined) {
        continue;
      }
      this.#index.delete(key);
      const consolidated = conslidateValues(entries);
      if (consolidated.length != 0) {
        this.#index.set(key, consolidated);
      }
    }
  }
}
