// Copyright (c) 2023 One Law LLC

export type Primitive = string | number | boolean | bigint;
export type Comparator<T> = (l: T, r: T) => number;

export class Node<T> implements INode<T> {
  size: number = 1;
  constructor(
    public value: T,
    public priority: number,
    public left: Node<T> | null = null,
    public right: Node<T> | null = null
  ) {}

  getChild(isRight: boolean): Node<T> | null {
    return isRight ? this.right : this.left;
  }
}

export interface INode<T> {
  value: T;
  left: INode<T> | null;
  right: INode<T> | null;
  getChild(isRight: boolean): INode<T> | null;
}

export interface ITree<T> {
  readonly size: number;
  readonly _root: Node<T> | null;
  readonly version: number;

  add(value: T): ITree<T>;
  delete(value: T): ITree<T>;
  clear(): ITree<T>;
  map<U>(callback: (value: T) => U): U[];
  filter(predicate: (value: T) => boolean): T[];
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
