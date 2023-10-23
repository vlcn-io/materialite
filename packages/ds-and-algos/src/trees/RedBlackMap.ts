import { RBTree } from "./RedBlackTree.js";

// TODO: an implicit contract of JS maps is that things come out in insertion order...
// We could keep track of the insertion order of items for iteration...
// this could also solve the concurrent modification problem.
// Would speed up un-ordered iteration
export class RBMap<K, V> implements Map<K, V> {
  readonly #tree;

  constructor(comparator: (a: K, b: K) => number) {
    this.#tree = new RBTree<[K, V]>((a: [K, V], b: [K, V]) => {
      return comparator(a[0], b[0]);
    });
  }

  get size() {
    return this.#tree.size;
  }

  clear() {
    this.#tree.clear();
  }

  delete(key: K) {
    return this.#tree.remove([key, undefined as any]);
  }

  entries() {
    return this.#tree.iterator();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.#tree.iterator();
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ) {
    for (const [key, value] of this) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  get(key: K) {
    const res = this.#tree.find([key, undefined as any]);
    return res == null ? undefined : res[1];
  }

  getWithDefault(key: K, def: V) {
    const res = this.#tree.find([key, undefined as any]);
    return res == null ? def : res[1];
  }

  has(key: K) {
    return this.#tree.find([key, undefined as any]) !== undefined;
  }

  *keys() {
    for (const [key, _value] of this) {
      yield key;
    }
  }

  set(key: K, value: V) {
    this.#tree.insert([key, value]);
    return this;
  }

  *values() {
    for (const [_key, value] of this) {
      yield value;
    }
  }

  [Symbol.toStringTag]: "RedBlackMap";
}
