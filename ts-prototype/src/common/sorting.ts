import { IndexKey, Value } from "../client/schema/Schema";

export function mergeSort(left: readonly (readonly [IndexKey, Value])[], right: readonly (readonly [IndexKey, Value])[]) {
  const ret = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i >= left.length) {
      ret.push(right[j]);
      j++;
      continue;
    }
    if (j >= right.length) {
      ret.push(left[i]);
      i++;
      continue;
    }
    const l = left[i]!;
    const r = right[j]!;
    if (l[0][2] < r[0][2]) {
      ret.push(left[i]);
      i++;
    } else {
      ret.push(right[j]);
      j++;
    }
  }
  return ret;
}
