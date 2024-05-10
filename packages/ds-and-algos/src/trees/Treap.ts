// Copyright (c) 2023 One Law LLC

import { INode, ITree, Node } from "../types.js";
import { TreeIterator } from "./TreeIterator.js";
type Comparator<T> = (a: T, b: T) => number;

export class Treap<T> implements ITree<T> {
  #comparator: Comparator<T>;
  private root: Node<T> | null = null;
  private _version;

  get version() {
    return this._version;
  }

  get comparator() {
    return this.#comparator;
  }

  constructor(comparator: Comparator<T>) {
    this.#comparator = comparator;
    this._version = 0;
  }

  static empty<T>() {
    return empty as Treap<T>;
  }

  get size() {
    return this.root?.size ?? 0;
  }

  get _root() {
    return this.root;
  }

  iteratorAfter(data: T) {
    const iter = this.lowerBound(data);

    while (iter.data !== null && this.#comparator(iter.data, data) === 0) {
      iter.next();
    }

    return iter;
  }

  lowerBound(data: T): TreeIterator<T> {
    let cur: INode<T> | null = this.root;
    const iter = new TreeIterator(this);

    while (cur !== null) {
      const c = this.#comparator(data, cur.value);
      if (c === 0) {
        iter.cursor = cur;
        return iter;
      }
      iter.ancestors.push(cur);
      cur = cur.getChild(c > 0);
    }

    for (let i = iter.ancestors.length - 1; i >= 0; --i) {
      cur = iter.ancestors[i]!;
      if (this.#comparator(data, cur.value) < 0) {
        iter.cursor = cur;
        iter.ancestors.length = i;
        return iter;
      }
    }

    iter.ancestors.length = 0;
    return iter;
  }

  add(value: T): Treap<T> {
    this._version++;
    const priority = Math.random(); // Random priority
    this.root = this._insert(this.root, value, priority);

    return this;
  }

  delete(value: T): Treap<T> {
    this.root = this._remove(this.root, value);
    this._version++;
    return this;
  }

  clear(): Treap<T> {
    this.root = null;
    this._version++;
    return this;
  }

  map<U>(callback: (value: T) => U): U[] {
    const result: U[] = [];

    for (const value of inOrderTraversal(this.root)) {
      result.push(callback(value));
    }

    return result;
  }

  filter(predicate: (value: T) => boolean): T[] {
    const result: T[] = [];

    for (const value of inOrderTraversal(this.root)) {
      if (predicate(value)) {
        result.push(value);
      }
    }

    return result;
  }

  reduce<U>(callback: (accumulator: U, value: T) => U, initialValue: U): U {
    let accumulator = initialValue;

    for (const value of inOrderTraversal(this.root)) {
      accumulator = callback(accumulator, value);
    }

    return accumulator;
  }

  contains(value: T): boolean {
    return this._contains(this.root, value);
  }

  toArray(): T[] {
    const result: T[] = [];

    for (const value of inOrderTraversal(this.root)) {
      result.push(value);
    }

    return result;
  }

  at(index: number): T | null {
    return this._getByIndex(this.root, index);
  }

  get(value: T): T | null {
    let currentNode = this.root;

    while (currentNode) {
      const cmp = this.#comparator(value, currentNode.value);

      if (cmp === 0) {
        return currentNode.value;
      } else if (cmp < 0) {
        currentNode = currentNode.left;
      } else {
        currentNode = currentNode.right;
      }
    }

    return null;
  }

  findIndex(value: T): number | null {
    return this._findIndex(this.root, value, 0);
  }

  _findIndex(node: Node<T> | null, value: T, offset: number): number | null {
    if (!node) return null;

    const cmp = this.#comparator(value, node.value);
    const thisIndex = (node.left?.size ?? 0) + offset;
    if (cmp === 0) {
      return thisIndex;
    }
    if (cmp < 0) return this._findIndex(node.left, value, offset);
    return this._findIndex(node.right, value, thisIndex + 1);
  }

  getMin(): T | null {
    if (!this.root) return null;
    return this._findMin(this.root).value;
  }

  getMax(): T | null {
    if (!this.root) return null;
    let currentNode = this.root;
    while (currentNode.right) {
      currentNode = currentNode.right;
    }
    return currentNode.value;
  }

  private _getByIndex(node: Node<T> | null, index: number): T | null {
    if (!node) return null;

    const leftSize = node.left ? node.left.size : 0;

    if (index === leftSize) {
      return node.value;
    } else if (index < leftSize) {
      return this._getByIndex(node.left, index);
    } else {
      return this._getByIndex(node.right, index - leftSize - 1);
    }
  }

  private _contains(node: Node<T> | null, value: T): boolean {
    if (!node) return false;

    const cmp = this.#comparator(value, node.value);

    if (cmp === 0) return true; // Found the value
    if (cmp < 0) return this._contains(node.left, value);
    return this._contains(node.right, value);
  }

  *[Symbol.iterator](): Generator<T> {
    yield* inOrderTraversal(this.root);
  }

  private _insert(node: Node<T> | null, value: T, priority: number): Node<T> {
    if (!node) {
      return new Node(value, priority);
    }

    const cmp = this.#comparator(value, node.value);
    const newNode = node;
    newNode.left = node.left;
    newNode.right = node.right;
    newNode.size = node.size + 1; // Increment the size since we're inserting.

    if (cmp < 0) {
      newNode.left = this._insert(newNode.left, value, priority);
    } else if (cmp > 0) {
      newNode.right = this._insert(newNode.right, value, priority);
    } else {
      newNode.value = value; // Duplicate insertion, just overwrite.
    }

    newNode.size = (newNode.left?.size ?? 0) + (newNode.right?.size ?? 0) + 1;
    return this._balance(newNode); // Balance the node after insertion.
  }

  _remove(node: Node<T> | null, value: T): Node<T> | null {
    if (!node) return null;

    let newNode = node;

    const cmp = this.#comparator(value, newNode.value);
    if (cmp < 0) {
      newNode.left = this._remove(newNode.left, value);
    } else if (cmp > 0) {
      newNode.right = this._remove(newNode.right, value);
    } else {
      if (!newNode.left) return newNode.right;
      if (!newNode.right) return newNode.left;

      const minRightNode = this._findMin(newNode.right);
      newNode.value = minRightNode.value; // Update the value with the min value from the right subtree.
      newNode.right = this._removeMin(newNode.right);
    }

    newNode.size =
      1 +
      (newNode.left ? newNode.left.size : 0) +
      (newNode.right ? newNode.right.size : 0); // Recalculate the size.
    return this._balance(newNode);
  }

  _removeMin(node: Node<T>): Node<T> | null {
    if (!node.left) return node.right;
    const newNode = node;
    newNode.size = node.size - 1;
    newNode.left = this._removeMin(node.left);
    newNode.right = node.right;
    newNode.size =
      1 +
      (newNode.left ? newNode.left.size : 0) +
      (newNode.right ? newNode.right.size : 0); // Recalculate the size.
    return this._balance(newNode);
  }

  _findMin(node: Node<T>): Node<T> {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  private _balance(node: Node<T>): Node<T> {
    if (node.right && node.right.priority < node.priority) {
      node = this._rotateLeft(node);
    }
    if (node.left && node.left.priority < node.priority) {
      node = this._rotateRight(node);
    }
    return node;
  }

  private _rotateLeft(node: Node<T>): Node<T> {
    const newNode = node.right!;
    node.right = newNode.left;
    newNode.left = node;

    newNode.size = node.size;
    node.size =
      1 + (node.left ? node.left.size : 0) + (node.right ? node.right.size : 0);

    return newNode;
  }

  private _rotateRight(node: Node<T>): Node<T> {
    const newNode = node.left!;
    node.left = newNode.right;
    newNode.right = node;

    newNode.size = node.size;
    node.size =
      1 + (node.left ? node.left.size : 0) + (node.right ? node.right.size : 0);

    return newNode;
  }
}

function* inOrderTraversal<T>(node: Node<T> | null): Generator<T> {
  const stack: Node<T>[] = [];
  let currentNode = node;

  while (stack.length > 0 || currentNode) {
    // Reach the left most Node of the current Node
    while (currentNode) {
      stack.push(currentNode);
      currentNode = currentNode.left;
    }

    // currentNode is null at this point
    currentNode = stack.pop()!; // Pop the top node, which is the next node in in-order

    yield currentNode.value;

    // Move to the right node
    currentNode = currentNode.right;
  }
}

const empty = new Treap<any>((_l, _r) => 0);
