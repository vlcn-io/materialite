import { isTuple } from "@vlcn.io/ds-and-algos/tuple";
import { objectId } from "@vlcn.io/ds-and-algos/objectTracking";

/**
 * Compares two values.
 * If A and B are tuples (as created by tuple.ts), compares their contents. If they contain tuples themselves,
 * compares those recursively.
 *
 * If A and B are objects, compare them by reference. How do we order references?
 * We assign each unique reference a unique integer ID, and order by that.
 *
 * If A is an object and B is not, A is greater.
 *
 * If B is an object and A is not, B is greater.
 *
 * If A and B are primitives, compare them using the standard comparison operators.
 *
 * @param a
 * @param b
 * @returns
 */
export function comparator(a: any, b: any): 1 | 0 | -1 {
  if (isTuple(a) && isTuple(b)) {
    if (a.length > b.length) {
      return 1;
    } else if (a.length < b.length) {
      return -1;
    }
    for (let i = 0; i < a.length; i++) {
      const cmp = comparator(a[i], b[i]);
      if (cmp !== 0) {
        return cmp;
      }
    }
    return 0;
  }

  if (typeof a === "object" && typeof b === "object") {
    const aId = objectId(a);
    const bId = objectId(b);
    if (aId < bId) {
      return -1;
    } else if (aId > bId) {
      return 1;
    }
    return 0;
  }

  if (typeof a === "object") {
    return 1;
  }

  if (typeof b === "object") {
    return -1;
  }

  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
}

export function keyedComaparator(a: [any, any], b: [any, any]): 1 | 0 | -1 {
  const cmp = comparator(a[0], b[0]);
  return cmp;
}
