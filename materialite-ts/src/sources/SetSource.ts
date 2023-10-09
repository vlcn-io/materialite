// This would need to track all live computations
// currently tapped off of the set.
// Clean up taps when they get GC'ed?
// When the sink is removed?

import { DifferenceStream } from "../core/graph/DifferenceStream";

// When the user explicitly finalizes them?
// TODO: all mutation methods should take in a `tx` so they can add themselves
// to the active tx?
// and on-commit we can release the queues of all touched
// sources.
// Remember we can optimistically pull too... for the given tx id number anyway.
export class SetSource<T> implements Set<T> {
  #set: Set<T>;
  #stream;

  constructor(from: T[] = []) {
    this.#set = new Set(from);
    this.#stream = new DifferenceStream<T>();
  }

  get stream() {
    return this.#stream;
  }

  add(value: T): this {
    this.#set.add(value);
    return this;
  }

  clear(): void {
    this.#set.clear();
  }

  delete(value: T): boolean {
    return this.#set.delete(value);
  }

  entries(): IterableIterator<[T, T]> {
    return this.#set.entries();
  }

  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: any
  ): void {
    this.#set.forEach(callbackfn, thisArg);
  }

  has(value: T): boolean {
    return this.#set.has(value);
  }

  get size(): number {
    return this.#set.size;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.#set.values();
  }

  keys(): IterableIterator<T> {
    return this.#set.keys();
  }

  values(): IterableIterator<T> {
    return this.#set.values();
  }

  [Symbol.toStringTag] = "SetSource";
}
