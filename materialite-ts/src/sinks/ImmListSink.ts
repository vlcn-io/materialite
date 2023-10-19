import { List } from "immutable";
import { Version } from "../core/types.js";
import { Multiset } from "../core/multiset.js";
import { Comparator } from "@vlcn.io/datastructures-and-algos/binary-search";
import { Sink } from "./Sink.js";

export class ImmListSink<T> extends Sink<T, List<T>> {
  #data: List<T> = List();

  get data() {
    return this.#data;
  }

  protected run(version: Version) {
    const collections = this.reader.drain(version);
    if (collections.length === 0) {
      return;
    }

    let changed = false;
    let newData = this.#data;
    collections.forEach((collection) => {
      // now we incrementally update our sink.
      [changed, newData] = this.#sink(collection, newData) || changed;
    });
    this.#data = newData;
    if (changed) {
      this.notify(newData);
    }
  }

  #sink(collection: Multiset<T>, data: List<T>): [boolean, List<T>] {
    let changed = false;
    for (let i = 0; i < collection.entries.length; ++i) {
      let [value, mult] = collection.entries[i]!;
      const idx = binarySearch(data, value, this.comparator);
      if (i + 1 < collection.entries.length) {
        const [nextValue, nextMult] = collection.entries[i + 1]!;
        if (
          Math.abs(mult) === 1 &&
          mult === -nextMult &&
          this.comparator(value, nextValue) === 0
        ) {
          if (idx >= 0) {
            changed = true;
            console.log("set...");
            data = data.set(idx, nextValue);
            i += 1;
          }
          continue;
        }
      }
      if (mult > 0) {
        changed = true;
        data = addAll(data, value, mult, idx);
      } else if (mult < 0 && idx >= 0) {
        changed = true;
        data = removeAll(data, value, Math.abs(mult), idx, this.comparator);
      }
    }

    return [changed, data];
  }
}

function binarySearch<T>(arr: List<T>, el: T, comparator: Comparator<T>) {
  let m = 0;
  let n = arr.size - 1;
  while (m <= n) {
    let k = (n + m) >> 1;
    let cmp = comparator(el, arr.get(k)!);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return ~m;
}

function addAll<T>(data: List<T>, value: T, mult: number, idx: number) {
  // add
  while (mult > 0) {
    if (idx < 0) {
      // add to the end
      const pos = Math.abs(idx) - 1;
      data = data.insert(pos, value);
    } else {
      data = data.insert(idx, value);
    }
    mult -= 1;
  }

  return data;
}

// TODO: wind back to least idx
function removeAll<T>(
  data: List<T>,
  value: T,
  mult: number,
  idx: number,
  comparator: Comparator<T>
) {
  while (mult > 0) {
    const elem = data.get(idx);
    if (elem === undefined || comparator(elem, value) !== 0) {
      break;
    }
    data = data.delete(idx);
    mult -= 1;
  }
  return data;
}
