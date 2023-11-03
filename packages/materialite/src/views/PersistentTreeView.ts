import { EventMetadata } from "../core/types.js";
import { Multiset } from "../core/multiset.js";
import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";
import { View } from "./View.js";
import { AbstractDifferenceStream } from "../core/graph/AbstractDifferenceStream.js";
import { Materialite } from "../materialite.js";

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

  constructor(
    materialite: Materialite,
    stream: AbstractDifferenceStream<T>,
    comparator: (a: T, b: T) => number
  ) {
    super(materialite, stream, comparator);
  }

  get data() {
    return this.#data;
  }

  // TODO: notify on empty?
  protected run(e: EventMetadata) {
    const collections = this.reader.drain(e.version);
    let changed = false;
    if (e.cause === "full_recompute") {
      this.#data = new PersistentTreap<T>(this.comparator);
      changed = true;
    }

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
