// Copyright (c) 2023 One Law LLC

import { Primitive } from "./types.js";

export function minBy<T>(x: Iterable<T>, f: (x: T) => Primitive) {
  let min: Primitive | undefined = undefined;
  let minVal: T | undefined = undefined;
  for (const val of x) {
    const v = f(val);
    if (min === undefined) {
      min = v;
      minVal = val;
    } else if (v < min) {
      min = v;
      minVal = val;
    }
  }
  return minVal;
}
