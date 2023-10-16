import { List } from "immutable";
import { Version } from "../core/types";
import { Multiset } from "../core/multiset";
import { Comparator } from "@vlcn.io/datastructures-and-algos/binary-search";
import { Sink } from "./Sink";

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
    const newData = this.#data.asMutable();
    collections.forEach((collection) => {
      // now we incrementally update our sink.
      changed = changed || this.#sink(collection, newData);
    });
    const immNewData = newData.asImmutable();
    this.#data = immNewData;
    if (changed) {
      this.notify(immNewData);
    }
  }

  #sink(collection: Multiset<T>, data: List<T>) {
    let changed = false;
    for (const entry of collection.entries) {
      let [value, mult] = entry;
      const idx = binarySearch(data, value, this.comparator);
      if (mult > 0) {
        changed = true;
        addAll(data, value, mult, idx);
      } else if (mult < 0 && idx !== -1) {
        changed = true;
        removeAll(data, value, Math.abs(mult), idx, this.comparator);
      }
    }
    return changed;
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
    if (idx === -1) {
      // add to the end
      data.push(value);
    } else {
      data.insert(idx, value);
    }
    mult -= 1;
  }
}

// TODO: test this and that binary search returns first occurence
// if it doesn't we need to decrement idx
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
    data.delete(idx);
    mult -= 1;
  }
}
