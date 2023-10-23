/**
 * Array that supports incremental computations against it.
 *
 * E.g.,
 *
 * ```
 * const a = new IncArray([1,2,3,...]);
 * const results = a.map().filter().reduce()...;
 *
 * a.push(4);
 * a[0] = 5;
 * ...
 * // results is updated incrementally on each change
 * ```
 *
 * - We can mutate the array in place (for users that accept that) and emit the multiset difference
 * for downstream computations.
 * - We could use `immutablejs` to have an immutable array and emit the difference.
 *
 * Mutating in place and emitting the difference may be fine given that the downstream incremental state is immutable...
 * And cached for future reads of it?
 *
 * Emit difference rather than calculate the difference.
 * Since we know the difference for each array operation.
 */

// class IncArray {}

// On commit, we signal.
// Operators that are waiting data from other inputs pull that data.
// Pulling drains the input, causing it to not signal.
