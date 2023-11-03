// A take is a situation where we will not
// send anything outside the window....
// but we'd need sorting to know that.
// So we can know the upper bound of the window
// and if something new comes in below that bound.
// This would trigger a remove of the thing outside the bound
// and insert of the new thing.

import { Comparator } from "@vlcn.io/ds-and-algos/types";
import { Entry, Multiset } from "../../multiset.js";
import { DifferenceStreamReader } from "../DifferenceReader.js";
import { DifferenceStreamWriter } from "../DifferenceWriter.js";
import { LinearUnaryOperator } from "./LinearUnaryOperator.js";
import { Treap } from "@vlcn.io/ds-and-algos/Treap";

/**
 * Emits results within a window of size `n`.
 *
 * The comparator determines what goes in this window.
 *
 * If we see new values that are less than the minimum of the window,
 * we take them in and update the minimum window.
 *
 * If we see new values that are greater than the maximum of the window,
 * we take them in and update the maximum window.
 *
 * This should generally be used in conjunction with `after`
 *
 * E.g.,
 *
 * ```ts
 * stream.after(5).take(10)
 * ```
 *
 * To ensure we take the first 10 values after the value 5. This
 * fixes our lower bound to 5.
 *
 * We could also implement an unordered take...
 */
export class TakeOperator<I> extends LinearUnaryOperator<I, I> {
  readonly #tree;
  readonly #comparator: Comparator<I>;
  readonly #limit;

  #max: Entry<I> | undefined;
  #min: Entry<I> | undefined;
  #size: 0;

  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>,
    n: number,
    comparator: Comparator<I>
  ) {
    super(input, output, (c: Multiset<I>) => this.#inner(c));
    this.#tree = new Treap<Entry<I>>((l, r) => comparator(l[0], r[0]));
    this.#comparator = comparator;
    this.#limit = n;
  }

  #inner(collection: Multiset<I>): Multiset<I> {
    if (this.#limit === 0) {
      return new Multiset([]);
    }

    const ret: Entry<I>[] = [];
    for (const [val, mult] of collection.entries) {
      if (mult === 0) {
        continue;
      }
      if (mult < 0) {
        this.#processRemove(val, mult, ret);
      } else {
        this.#processAdd(val, mult, ret);
      }
    }
    return new Multiset(ret);
  }

  #processRemove(val: I, mult: number, ret: Entry<I>[]) {
    const min = this.#min;
    const max = this.#max;
    // We assume that a thing must exist before it can be remove.
    // Given that, we don't need to add negatives to the window.
    if (min === undefined || max === undefined) {
      return;
    }
    if (this.#isOutOfRange(val, min, max)) {
      return;
    }

    const existing = this.#tree.get([val, 0]);
    if (existing != null) {
      const [_, existingMult] = existing;
      if (existingMult + mult <= 0) {
        this.#size -= existingMult;
        this.#tree.delete([val, 0]);
      } else {
        // replace existing with updated multipilicity
        this.#size += mult;
        this.#tree.add([val, existingMult + mult]);
      }
      // Pass the event down the line
      ret.push([val, mult]);
    }
  }

  // TODO: cap the `mult` of the add to the limit?
  #processAdd(val: I, mult: number, ret: Entry<I>[]) {
    if (this.#min === undefined || this.#max === undefined) {
      this.#min = [val, mult];
      this.#max = [val, mult];
      this.#size += mult;
      this.#tree.add([val, mult]);
      ret.push([val, mult]);
      return;
    }

    const isLessThenMin = this.#comparator(val, this.#min[0]) < 0;
    const isGreaterThanMax = this.#comparator(val, this.#max[0]) > 0;
    if (this.#tree.size >= this.#limit) {
      if (isLessThenMin) {
        // we're under the min and at limit?
        // discard removal since we don't have it
        return;
      }
      if (isGreaterThanMax) {
        // we're above the max and at limit?
        // discard removal since we don't have it
        return;
      }

      // otherwise, we're in the middle of the window
      // insert new and evict max
      // TODO: take mult into account for the eviction.
      // We do not need to evict all max if new insert is mult 1 and max as mult 2, for example.
      // Also need to handle if we need to evict many maxes because of very large mult on new entry.
      this.#size -= this.#max[1];
      this.#tree.delete(this.#max);
      // retract the max from the downstream
      ret.push([this.#max[0], -this.#max[1]]);

      // add the new value
      this.#size += mult;
      this.#tree.add([val, mult]);
      ret.push([val, mult]);

      // now find new max
      this.#max = this.#tree.getMax()!;
      return;
    }
    if (this.#size < this.#limit) {
      // just add given we're under size.
      const newMult = Math.min(mult, this.#limit - this.#size);
      this.#size += newMult;
      this.#tree.add([val, newMult]);
      ret.push([val, newMult]);
    }
  }

  #isOutOfRange(val: I, min: Entry<I>, max: Entry<I>) {
    // we're under the min and at limit?
    // discard removal since we don't have it
    if (this.#comparator(val, min[0]) < 0 && this.#size === this.#limit) {
      return true;
    }
    // we're above the max and at limit?
    // discard removal since we don't have it
    if (this.#comparator(val, max[0]) > 0 && this.#size === this.#limit) {
      return true;
    }

    return false;
  }
}
