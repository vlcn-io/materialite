import { Version } from "../core/types.js";
import { Multiset } from "../core/multiset.js";
import { PersistentTreap } from "@vlcn.io/datastructures-and-algos/PersistentTreap";
import { Sink } from "./Sink.js";

export class ImmSortedTreeSink<T> extends Sink<T, PersistentTreap<T>> {
  #data: PersistentTreap<T> = new PersistentTreap<T>(this.comparator);

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
    for (const c of collections) {
      [changed, newData] = this.#sink(c, newData) || changed;
    }
    this.#data = newData;
    if (changed) {
      this.notify(newData);
    }
  }

  #sink(
    c: Multiset<T>,
    data: PersistentTreap<T>
  ): [boolean, PersistentTreap<T>] {
    let changed = false;
    for (let i = 0; i < c.entries.length; ++i) {
      let [value, mult] = c.entries[i]!;
      if (i + 1 < c.entries.length) {
        const [nextValue, nextMult] = c.entries[i + 1]!;
        if (
          Math.abs(mult) === 1 &&
          mult === -nextMult &&
          this.comparator(value, nextValue) === 0
        ) {
          changed = true;
          data = data.replace(nextValue);
          i += 1;
          continue;
        }
      }

      if (mult > 0) {
        changed = true;
        data = addAll(data, value, mult);
      } else if (mult < 0) {
        changed = true;
        data = removeAll(data, value, Math.abs(mult));
      }
    }

    return [changed, data];
  }
}

function addAll<T>(data: PersistentTreap<T>, value: T, mult: number) {
  while (mult > 0) {
    data = data.add(value);
    mult -= 1;
  }

  return data;
}

function removeAll<T>(data: PersistentTreap<T>, value: T, mult: number) {
  while (mult > 0) {
    data = data.delete(value);
    mult -= 1;
  }

  return data;
}
