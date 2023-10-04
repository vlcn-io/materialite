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
 */
