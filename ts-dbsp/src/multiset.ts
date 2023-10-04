export type Entry = readonly [Value, Multiplicity];
type Multiplicity = number;
type Value = any;

/**
 * A naive implementation of a multi-set.
 * I.e., no optimization is going on here.
 */
export class Multiset {
  constructor(public readonly entires: readonly Entry[]) {
  }

  // Is this how we really want to do difference?
  // Or should we do it in a normalize way which will actually shrink the size of the multiset?
  difference(b: Multiset): Multiset {
    return new Multiset([...this.entires, ...b.negate().entires]);
  }

  concat(b: Multiset): Multiset {
    return new Multiset([...this.entires, ...b.entires]);
  }

  negate(): Multiset {
    return new Multiset(this.entires.map(([value, multiplicity]) => [value, -multiplicity]));
  }

  // aka normalize
  consolidate(): Multiset {
    return new Multiset([...this.#toNormalizedMap()]);
  }

  map(f: (value: Value) => Value): Multiset {
    return new Multiset(this.entires.map(([value, multiplicity]) => [f(value), multiplicity]));
  }

  filter(f: (value: Value) => boolean): Multiset {
    return new Multiset(this.entires.filter(([value, _]) => f(value)));
  }

  reduce(f: (values: Multiset) => Multiset): Map<Value, Multiset> {
    const byKey = new Map<Value, Entry[]>();
    for (const [value, multiplicity] of this.entires) {
      const existing = byKey.get(value);
      if (existing === undefined) {
        byKey.set(value, [[value, multiplicity]]);
      } else {
        existing.push([value, multiplicity]);
      }
    }

    const ret = new Map<Value, Multiset>();
    for (const [value, entries] of byKey) {
      ret.set(value, f(new Multiset(entries)));
    }
    return ret;
  }

  join<V>(left: readonly (readonly [Value, V])[], right: readonly (readonly [Value, V])[]) {
    const ret = new Map<Value, V[]>();
    for (const [value, v] of left) {
      const existing = ret.get(value);
      if (existing === undefined) {
        ret.set(value, [v]);
      } else {
        existing.push(v);
      }
    }
    for (const [value, v] of right) {
      const existing = ret.get(value);
      if (existing === undefined) {
        ret.set(value, [v]);
      } else {
        existing.push(v);
      }
    }
    return ret.entries();
  }

  iterate(f: (values: Multiset) => Multiset) {
    // apply f to the multiset in turn until the multiset stops changing
    // f must only be combinations of the public operations of this class
    let current: Multiset = this;
    let next = f(current);
    while (!current.equals(next)) {
      current = next;
      next = f(current);
    }
  }

  equals(b: Multiset): boolean {
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

  #toNormalizedMap(): Map<Value, Multiplicity> {
    const ret = new Map<Value, Multiplicity>();
    for (const [value, multiplicity] of this.entires) {
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
}

/*
const ret = this.#toNormalizedMap();

for (const [value, multiplicity] of b.entires) {
  if (multiplicity == 0) {
    continue;
  }
  const existing = ret.get(value);
  if (existing === undefined) {
    if (multiplicity > 0) {
      ret.set(value, -multiplicity);
    } else {
      ret.set(value, multiplicity);
    }
  } else {
    let sum = 0;
    if (multiplicity > 0) {
      sum = existing - multiplicity;
    } else {
      sum = existing + multiplicity;
    }
    
    if (sum === 0) {
      ret.delete(value);
    } else {
      ret.set(value, sum);
    }
  }
}
*/