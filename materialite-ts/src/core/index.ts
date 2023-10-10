import {
  JoinResult,
  Tuple2,
  isJoinResult,
  makeJoinResult,
  makeTuple2,
} from "@vlcn.io/datastructures-and-algos/tuple";
import { Entry, JoinableValue, Multiset, PrimitiveValue } from "./multiset";
import { TuplableMap } from "@vlcn.io/datastructures-and-algos/TuplableMap";

export class Index<K extends PrimitiveValue, V> {
  private readonly index = new Map<K, Entry<V>[]>();

  constructor() {}

  add(key: K, value: Entry<V>) {
    let existing = this.index.get(key);
    if (existing === undefined) {
      existing = [];
      this.index.set(key, existing);
    }
    existing.push(value);
  }

  extend(index: Index<K, V>) {
    for (const [key, value] of index.index) {
      for (const entry of value) {
        this.add(key, entry);
      }
    }
  }

  get(key: K): Entry<V>[] {
    return this.index.get(key) ?? [];
  }

  join<VO>(
    other: Index<K, VO>
  ): Multiset<JoinableValue<K, readonly (V | VO)[]>> {
    const ret: (readonly [Tuple2<K, JoinResult<V | VO>>, number])[] = [];
    for (const [key, entry] of this.index) {
      const otherEntry = other.index.get(key);
      if (otherEntry === undefined) {
        continue;
      }
      for (const [v1, m1] of entry) {
        for (const [v2, m2] of otherEntry) {
          // Flatten our join results so we don't
          // end up arbitrarily deep after many joins.
          let value: (V | VO)[];
          if (Array.isArray(v1) && isJoinResult(v1)) {
            value = v1.concat(v2);
          } else if (Array.isArray(v2) && isJoinResult(v2)) {
            value = v2.concat(v1);
          } else {
            value = [v1, v2];
          }
          ret.push([
            makeTuple2([key, makeJoinResult(value as any)]),
            m1 * m2,
          ] as const);
        }
      }
    }
    return new Multiset(ret);
  }

  compact(keys: K[] = []) {
    function consolidateValues(values: Entry<V>[]): [V, number][] {
      // TODO: tmap needs to be something better for consolidation...
      // Maybe we use _actual_ tuple types and the rest is normal object equality.
      const consolidated = new TuplableMap<V, number>();
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

    // spread `keys` b/c if we do not then when we add below the iterator will continue.
    const iterableKeys = keys.length != 0 ? keys : [...this.index.keys()];
    for (const key of iterableKeys) {
      const entries = this.index.get(key);
      if (entries === undefined) {
        continue;
      }
      this.index.delete(key);
      const consolidated = consolidateValues(entries);
      if (consolidated.length != 0) {
        this.index.set(key, consolidated);
      }
    }
  }
}
