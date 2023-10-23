import { Multiset } from "../core/multiset.js";
import {
  binarySearch,
  Comparator,
} from "@vlcn.io/datastructures-and-algos/binary-search";

export function sinkMutableArray<T>(
  collection: Multiset<T>,
  data: T[],
  comparator: Comparator<T>
): boolean {
  let changed = false;
  for (const entry of collection.entries) {
    let [value, mult] = entry;
    const idx = binarySearch(data, value, comparator);
    if (mult > 0) {
      changed = true;
      addAll(data, value, mult, idx);
    } else if (mult < 0 && idx !== -1) {
      changed = true;
      removeAll(data, value, Math.abs(mult), idx, comparator);
    }
  }

  return changed;
}

export function addAll<T>(data: T[], value: T, mult: number, idx: number) {
  // add
  while (mult > 0) {
    if (idx === -1) {
      // add to the end
      data.push(value);
    } else {
      data.splice(idx, 0, value);
    }
    mult -= 1;
  }
}

export function removeAll<T>(
  data: T[],
  value: T,
  mult: number,
  idx: number,
  comparator: Comparator<T>
) {
  // TODO: wind back to least idx
  while (mult > 0) {
    const elem = data[idx];
    if (elem === undefined || comparator(elem, value) !== 0) {
      break;
    }
    data.splice(idx, 1);
    mult -= 1;
  }
}
