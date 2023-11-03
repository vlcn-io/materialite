// Copyright (c) 2023 One Law LLC

export type Primitive = string | number | boolean | bigint;
export type Comparator<T> = (l: T, r: T) => number;

export class Node<T> {
  size: number = 1;
  constructor(
    public value: T,
    public priority: number,
    public left: Node<T> | null = null,
    public right: Node<T> | null = null
  ) {}
}

export interface ITreap<T> {
  readonly size: number;
  readonly _root: Node<T> | null;
  add(value: T): ITreap<T>;
  delete(value: T): ITreap<T>;
  clear(): ITreap<T>;
  map<U>(callback: (value: T) => U): U[];
  filter(predicate: (value: T) => boolean): T[];
  findIndex(pred: (x: T) => boolean): number;
  contains(value: T): boolean;
  reduce<U>(callback: (accumulator: U, value: T) => U, initialValue: U): U;
  toArray(): T[];
  at(index: number): T | null;
  get(value: T): T | null;
  getMin(): T | null;
  getMax(): T | null;
  iteratorAfter(value: T): Iterator<T>;
  [Symbol.iterator](): Generator<T>;
}
