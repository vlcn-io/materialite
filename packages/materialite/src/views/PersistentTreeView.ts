import { Version } from "../core/types.js";
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

  // If the view has a limit
  // We could not put this in the view
  // and instead re-materialize a stream...
  // clone with new args essentially...
  // then we can use the normal take operator.
  // Rematerialize is so bogus. So niche.
  // Use case is infinite scroll...
  #limit?: number;
  #min?: T;
  #max?: T;

  constructor(
    materialite: Materialite,
    stream: AbstractDifferenceStream<T>,
    comparator: (a: T, b: T) => number,
    limit?: number
  ) {
    super(materialite, stream, comparator);
    this.#limit = limit;
    if (limit !== undefined) {
      this.#addAll = this.#limitedAddAll;
      this.#removeAll = this.#limitedRemoveAll;
    } else {
      this.#addAll = addAll;
      this.#removeAll = removeAll;
    }
  }

  #addAll: (data: PersistentTreap<T>, value: T) => PersistentTreap<T>;
  #removeAll: (data: PersistentTreap<T>, value: T) => PersistentTreap<T>;

  get value() {
    return this.#data;
  }

  // TODO: notify on empty?
  protected run(version: Version) {
    const collections = this.reader.drain(version);
    let changed = false;

    let newData = this.#data;
    for (const c of collections) {
      if (c.eventMetadata?.cause === "full_recompute") {
        newData = new PersistentTreap<T>(this.comparator);
        changed = true;
      }
      [changed, newData] = this.#sink(c, newData) || changed;
    }
    this.#data = newData;
    if (changed) {
      this.notify(newData, version);
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

    const process = (value: T, mult: number) => {
      if (mult > 0) {
        changed = true;
        data = this.#addAll(data, value);
      } else if (mult < 0) {
        changed = true;
        data = this.#removeAll(data, value);
      }
    };

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

    return [changed || empty, data];
  }

  #limitedAddAll(data: PersistentTreap<T>, value: T) {
    return data;
  }

  #limitedRemoveAll(data: PersistentTreap<T>, value: T) {
    return data;
  }
}

function addAll<T>(data: PersistentTreap<T>, value: T) {
  // A treap can't have dupes so we can ignore `mult`
  data = data.add(value);
  return data;
}

function removeAll<T>(data: PersistentTreap<T>, value: T) {
  // A treap can't have dupes so we can ignore `mult`
  data = data.delete(value);
  return data;
}
