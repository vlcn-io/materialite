/**
 * A map that can have tuples for keys
 */
const marker = Symbol("marker");

export class TMap<K, V> {
  #map = new Map();

  constructor() {}

  set(key: K, value: V) {
    if (Array.isArray(key)) {
      this.#map.set(JSON.stringify(key), [marker, key, value]);
    } else {
      this.#map.set(key, value);
    }
  }

  get(key: K) {
    if (Array.isArray(key)) {
      const ret = this.#map.get(JSON.stringify(key));
      if (ret === undefined) {
        return ret;
      }
      return ret[2];
    }
    return this.#map.get(key);
  }

  delete(key: K) {
    if (Array.isArray(key)) {
      return this.#map.delete(JSON.stringify(key));
    }
    return this.#map.delete(key);
  }

  entries() {
    const entries = this.#map.entries();
    const ret = [];
    for (const [key, value] of entries) {
      if (Array.isArray(value) && value[0] === marker) {
        ret.push([value[1], value[2]]);
      } else {
        ret.push([key, value]);
      }
    }

    return ret;
  }

  keys() {
    const entries = this.#map.entries();
    const ret = [];
    for (const [key, value] of entries) {
      if (Array.isArray(value) && value[0] === marker) {
        ret.push(value[1]);
      } else {
        ret.push(key);
      }
    }

    return ret;
  }

  values() {
    const values = this.#map.values();
    const ret = [];
    for (const value of values) {
      if (Array.isArray(value) && value[0] === marker) {
        ret.push(value[2]);
      } else {
        ret.push(value);
      }
    }
    return ret;
  }

  get size() {
    return this.#map.size;
  }

  clear() {
    return this.#map.clear();
  }
}
