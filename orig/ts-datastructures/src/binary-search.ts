export type Comparator<T> = (l: T, r: T) => number;

export function binarySearch<T>(
  arr: readonly T[],
  el: T,
  comparator: Comparator<T>
) {
  let m = 0;
  let n = arr.length - 1;
  while (m <= n) {
    let k = (n + m) >> 1;
    let cmp = comparator(el, arr[k]!);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return ~m;
}
