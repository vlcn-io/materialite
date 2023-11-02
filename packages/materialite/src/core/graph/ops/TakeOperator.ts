// A take is a situation where we will not
// send anything outside the window....
// but we'd need sorting to know that.
// So we can know the upper bound of the window
// and if something new comes in below that bound.
// This would trigger a remove of the thing outside the bound
// and insert of the new thing.

import { Comparator } from "immutable";
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
  #tree;
  #limit;
  #max: I | undefined;
  #min: I | undefined;
  #size: 0;

  constructor(
    input: DifferenceStreamReader<I>,
    output: DifferenceStreamWriter<I>,
    n: number,
    comparator: Comparator<I>
  ) {
    super(input, output, (c: Multiset<I>) => this.#inner(c));
    this.#tree = new Treap(comparator);
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

  #processRemove() {}

  #processAdd() {}
}
