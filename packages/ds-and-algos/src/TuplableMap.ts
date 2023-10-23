import { objectId } from "./objectTracking.js";
import { isTuple } from "./tuple.js";

/**
 * A regular JavaScript map but it can have tuples of arbitrary things for keys.
 *
 * We'd have to encode the tuple entries.
 */
export class TuplableMap<K, V> implements Map<K, V> {
  #map: Map<any, [K, V]>;

  constructor() {
    this.#map = new Map();
  }

  get size() {
    return this.#map.size;
  }

  clear() {
    this.#map.clear();
  }

  delete(key: K) {
    return this.#map.delete(toKey(key));
  }

  *entries() {
    for (const [_, entry] of this.#map.entries()) {
      yield entry;
    }
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (const [_, entry] of this.#map) {
      yield entry;
    }
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
    const res = this.#map.get(toKey(key));
    return res == null ? undefined : res[1];
  }

  getWithDefault(key: K, def: V) {
    const k = toKey(key);
    const res = this.#map.get(k);
    if (res === undefined) {
      this.#map.set(k, [key, def]);
    }
    return res == null ? def : res[1];
  }

  has(key: K) {
    return this.#map.has(toKey(key));
  }

  *keys() {
    for (const [key, _value] of this) {
      yield key;
    }
  }

  set(key: K, value: V) {
    this.#map.set(toKey(key), [key, value]);
    return this;
  }

  *values() {
    for (const [_key, value] of this) {
      yield value;
    }
  }

  [Symbol.toStringTag]: string = "TuplableMap";
}

function toKey(k: any): any {
  // if it is a tuple, recursively convert each entry
  if (isTuple(k)) {
    return k.map(toKey).join("\uE0FA");
  }
  if (typeof k === "object") {
    return "\uE0FB" + objectId(k);
  }

  if (k === null) {
    return "\uE0FC";
  } else if (k === undefined) {
    return "\uE0FD";
  }

  return k.toString();
}
