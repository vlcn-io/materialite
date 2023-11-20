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

  /**
   * Re-materialize the view but with a new limit.
   * All other params remain the same.
   * Returns a new view.
   * The view will ask the upstream for data _after_ the current view's max
   */
  rematerialize(newLimit: number) {
    const newView = new PersistentTreeView(
      this.materialite,
      this.stream,
      this.comparator,
      newLimit
    );
    newView.#data = this.#data;

    if (this.#max !== undefined) {
      this.materialite.tx(() => {
        newView.reader.pull({
          expressions: [
            {
              _tag: "after",
              comparator: this.comparator,
              cursor: this.#max,
            },
          ],
        });
      });
    } else {
      this.materialite.tx(() => {
        newView.reader.pull({ expressions: [] });
      });
    }

    return newView;
  }

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

    let sourceComparator;
    if (
      c.eventMetadata?.cause === "full_recompute" ||
      c.eventMetadata?.cause === "partial_recompute"
    ) {
      sourceComparator = c.eventMetadata.comparator;
    }

    const process = (value: T, mult: number) => {
      if (mult > 0) {
        changed = true;
        data = this.#addAll(data, value);
      } else if (mult < 0) {
        changed = true;
        data = this.#removeAll(data, value);
      }
    };

    // TODO: we should bail from this loop early if we're in a re-compute pass
    // and detect that we've filled out limit.
    // And the source is ordered the same as this.......
    while (!(next = iterator.next()).done) {
      if (
        sourceComparator &&
        sourceComparator === this.comparator &&
        this.#limit !== undefined
      ) {
        if (data.size >= this.#limit) {
          // bail early. During a re-compute with a source in the same order
          // as the view we can bail once we've consumed `LIMIT` items.
          break;
        }
      }

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
    const limit = this.#limit || 0;
    // Under limit? We can just add.
    if (data.size < limit) {
      this.#updateMinMax(value);
      return data.add(value);
    }

    if (data.size > limit) {
      throw new Error(`Data size exceeded limit! ${data.size} | ${limit}`);
    }

    // at limit? We can only add if the value is under max
    const comp = this.comparator(value, this.#max!);
    if (comp > 0) {
      return data;
    }
    // <= max we add.
    data = data.add(value);
    // and then remove the max since we were at limit
    data = data.delete(this.#max!);
    // and then update max
    this.#max = data.getMax() || undefined;

    // and what if the value was under min? We update our min.
    if (this.comparator(value, this.#min!) <= 0) {
      this.#min = value;
    }
    return data;
  }

  #limitedRemoveAll(data: PersistentTreap<T>, value: T) {
    // if we're outside the window, do not remove.
    const minComp = this.#min && this.comparator(value, this.#min);
    const maxComp = this.#max && this.comparator(value, this.#max);

    if (minComp && minComp < 0) {
      return data;
    }

    if (maxComp && maxComp > 0) {
      return data;
    }

    // inside the window?
    // do the removal and update min/max
    // only update min/max if the removals was equal to min/max tho
    // otherwise we removed a element that doesn't impact min/max

    data = data.delete(value);
    // TODO: since we deleted we need to send a request upstream for more data!

    if (minComp && minComp === 0) {
      this.#min = value;
    }
    if (maxComp && maxComp === 0) {
      this.#max = value;
    }

    return data;
  }

  #updateMinMax(value: T) {
    if (this.#min === undefined || this.#max === undefined) {
      this.#max = this.#min = value;
      return;
    }

    if (this.comparator(value, this.#min) <= 0) {
      this.#min = value;
      return;
    }

    if (this.comparator(value, this.#max) >= 0) {
      this.#max = value;
      return;
    }
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

/**
 * Limited add algorithm:
 *
 * 1. Under limit? Add the thing. Set min and max appropriately.
 * 2. At limit? Only add if less than max. Kick out max. Update max. Update min if needed.
 * 3. Can always _move down_ can never _move up_
 *
 * Removals?
 * 1. Outside min,max window? not present, no removal
 * 2. In window, remove. Update min/max if value we min or max.
 * 3. Under size limit post removal? Ask source for more data.
 *
 * Ask for more data:
 * 1. The view has the least thing
 * 2. And all contiguous least things up till max
 * 3. So we only need to request >= max.
 *
 * Hmm.. Enforce a constraint in the system that all comparators must take primary key into account?
 * That all entries are unique?
 *
 * How about that array problem? Array of numbers problem. They're non-unique and we need to deal with that.
 */
