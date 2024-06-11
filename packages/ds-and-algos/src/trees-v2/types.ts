export type Primitive = string | number | boolean | bigint;
export type Comparator<T> = (l: T, r: T) => number;

export class Node<T> implements INode<T> {
  size: number = 1;
  constructor(
    public value: T,
    public priority: number,
    public left?: Node<T> | undefined,
    public right?: Node<T> | undefined,
  ) {}

  getChild(isRight: boolean): Node<T> | undefined {
    return isRight ? this.right : this.left;
  }
}

export interface INode<T> {
  value: T;
  left?: INode<T> | undefined;
  right?: INode<T> | undefined;
  getChild(isRight: boolean): INode<T> | undefined;
}

export interface ITree<T> {
  readonly size: number;
  readonly root: Node<T> | undefined;
  readonly version: number;

  add(value: T): ITree<T>;
  delete(value: T): ITree<T>;
  clear(): ITree<T>;
  map<U>(callback: (value: T) => U): U[];
  filter(predicate: (value: T) => boolean): T[];
  contains(value: T): boolean;
  reduce<U>(callback: (accumulator: U, value: T) => U, initialValue: U): U;
  toArray(): T[];
  at(index: number): T | undefined;
  get(value: T): T | undefined;
  getMin(): T | undefined;
  getMax(): T | undefined;
  iteratorAfter(value: T): IterableIterator<T>;
  [Symbol.iterator](): Generator<T>;
}
