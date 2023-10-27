import { Version } from "../core/types.js";
import { Multiset } from "../core/multiset.js";
import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import { View } from "./View.js";
import { DifferenceStream } from "../index.js";

/**
 * A sink that maintains the list of values in-order.
 * Like any tree, insertion time is O(logn) no matter where the insertion happens.
 * Useful for maintaining large sorted lists.
 *
 * This sink is persistent in that each write creates a new version of the tree.
 * Copying the tree is relatively cheap (O(logn)) as we share structure with old versions
 * of the tree.
 */
export class PersistentTreeView<T> extends View<T, PersistentTreap<T>> {
  #data: PersistentTreap<T> = new PersistentTreap<T>(this.comparator);

  constructor(stream: DifferenceStream<T>, comparator: (a: T, b: T) => number) {
    super(stream, comparator);
  }

  get data() {
    return this.#data;
  }

  protected run(version: Version) {
    const collections = this.reader.drain(version);
    console.log("run with", collections);
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
    let empty = true;
    const iterator = c.entries[Symbol.iterator]();
    let next;
    while (!(next = iterator.next()).done) {
      empty = false;
      const [value, mult] = next.value;
      console.log(value);
      let nextNext = iterator.next();
      if (!nextNext.done) {
        const [nextValue, nextMult] = nextNext.value;
        if (
          Math.abs(mult) === 1 &&
          mult === -nextMult &&
          this.comparator(nextValue, value) == 0
        ) {
          changed = true;
          // The tree doesn't allow dupes -- so this is a replace.
          data = data.add(nextMult > 0 ? nextValue : value);
          continue;
        }
      }

      process(value, mult);
      if (!nextNext.done) {
        const [value, mult] = nextNext.value;
        process(value, mult);
      }
    }

    function process(value: T, mult: number) {
      if (mult > 0) {
        changed = true;
        data = addAll(data, value, mult);
      } else if (mult < 0) {
        changed = true;
        data = removeAll(data, value, Math.abs(mult));
      }
    }

    return [changed || empty, data];
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
