// Copyright (c) 2023 One Law LLC

import {ITree, Node} from './types.js';
type Comparator<T> = (a: T, b: T) => number;

/**
 * A persistent binary search tree.
 * It stays balanced by using random priorities.
 * On add/remove, the highest priority node is rotated upwards.
 *
 * On average, O(log(n)) height. Has a much smaller constant factor
 * that other trees given the simplicity of balancing.
 *
 * Also stores `size` in each node so we can index it like an array.
 * Important for virtualized table views.
 */
export class PersistentTreap<T> implements ITree<T> {
  #comparator: Comparator<T>;
  #root?: Node<T> | undefined;
  readonly version;

  constructor(comparator: Comparator<T>, version = 0) {
    this.#comparator = comparator;
    this.version = version;
  }

  static empty<T>() {
    return empty as PersistentTreap<T>;
  }

  get size() {
    return this.#root?.size ?? 0;
  }

  get root() {
    return this.#root;
  }

  iteratorAfter(data: T | undefined) {
    if (data === undefined) {
      return inOrderTraversal(this.#root);
    }
    return boundedInOrderTraversal(this.#comparator, this.#root, data);
  }

  iteratorBefore(data: T | undefined) {
    if (data === undefined) {
      return reverseOrderTraversal(this.#root);
    }
    return boundedReverseOrderTraversal(this.#comparator, this.#root, data);
  }

  add(value: T): PersistentTreap<T> {
    const priority = Math.random(); // Random priority
    const root = this.#insert(this.#root, value, priority);
    const ret = new PersistentTreap(this.#comparator, this.version + 1);
    ret.#root = root;
    return ret;
  }

  delete(value: T): PersistentTreap<T> {
    const root = this.#remove(this.#root, value);
    const ret = new PersistentTreap(this.#comparator, this.version + 1);
    ret.#root = root;
    return ret;
  }

  clear(): PersistentTreap<T> {
    const ret = new PersistentTreap(this.#comparator, this.version + 1);
    ret.#root = undefined;
    return ret;
  }

  map<U>(callback: (value: T) => U): U[] {
    const result: U[] = [];

    for (const value of inOrderTraversal(this.#root)) {
      result.push(callback(value));
    }

    return result;
  }

  filter(predicate: (value: T) => boolean): T[] {
    const result: T[] = [];

    for (const value of inOrderTraversal(this.#root)) {
      if (predicate(value)) {
        result.push(value);
      }
    }

    return result;
  }

  // TODO: we can do better here. We can `findIndex` based on a provided value in O(logn)
  findIndexByPredicate(pred: (x: T) => boolean): number {
    let index = 0;

    for (const value of inOrderTraversal(this.#root)) {
      if (pred(value)) {
        return index;
      }
      index += 1;
    }

    return -1;
  }

  findIndex(value: T): number | undefined {
    return this.#findIndex(this.#root, value, 0);
  }

  #findIndex(
    node: Node<T> | undefined,
    value: T,
    offset: number,
  ): number | undefined {
    if (!node) return undefined;

    const cmp = this.#comparator(value, node.value);
    const thisIndex = (node.left?.size ?? 0) + offset;
    if (cmp === 0) {
      return thisIndex;
    }
    if (cmp < 0) return this.#findIndex(node.left, value, offset);
    return this.#findIndex(node.right, value, thisIndex + 1);
  }

  reduce<U>(callback: (accumulator: U, value: T) => U, initialValue: U): U {
    let accumulator = initialValue;

    for (const value of inOrderTraversal(this.#root)) {
      accumulator = callback(accumulator, value);
    }

    return accumulator;
  }

  contains(value: T): boolean {
    return this.#contains(this.#root, value);
  }

  toArray(): T[] {
    const result: T[] = [];

    for (const value of inOrderTraversal(this.#root)) {
      result.push(value);
    }

    return result;
  }

  at(index: number): T | undefined {
    return this.#getByIndex(this.#root, index);
  }

  get(value: T): T | undefined {
    let currentNode = this.#root;

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

    return undefined;
  }

  getMin(): T | undefined {
    if (!this.#root) return undefined;
    return this.findMin(this.#root).value;
  }

  getMax(): T | undefined {
    if (!this.#root) return undefined;
    let currentNode = this.#root;
    while (currentNode.right) {
      currentNode = currentNode.right;
    }
    return currentNode.value;
  }

  #getByIndex(node: Node<T> | undefined, index: number): T | undefined {
    if (!node) return undefined;

    const leftSize = node.left ? node.left.size : 0;

    if (index === leftSize) {
      return node.value;
    } else if (index < leftSize) {
      return this.#getByIndex(node.left, index);
    }
    return this.#getByIndex(node.right, index - leftSize - 1);
  }

  #contains(node: Node<T> | undefined, value: T): boolean {
    if (!node) return false;

    const cmp = this.#comparator(value, node.value);

    if (cmp === 0) return true; // Found the value
    if (cmp < 0) return this.#contains(node.left, value);
    return this.#contains(node.right, value);
  }

  [Symbol.iterator]() {
    return inOrderTraversal(this.#root);
  }

  reverseIterator() {
    return reverseOrderTraversal(this.#root);
  }

  iterator() {
    return inOrderTraversal(this.#root);
  }

  #insert(node: Node<T> | undefined, value: T, priority: number): Node<T> {
    if (!node) {
      return new Node(value, priority);
    }

    const cmp = this.#comparator(value, node.value);

    const newNode = new Node(node.value, node.priority);
    newNode.left = node.left;
    newNode.right = node.right;
    newNode.size = node.size + 1; // Increment the size since we're inserting.

    if (cmp < 0) {
      newNode.left = this.#insert(newNode.left, value, priority);
    } else if (cmp > 0) {
      newNode.right = this.#insert(newNode.right, value, priority);
    } else {
      newNode.value = value; // Duplicate insertion, just overwrite.
    }

    newNode.size = (newNode.left?.size ?? 0) + (newNode.right?.size ?? 0) + 1;
    return this.#balance(newNode); // Balance the node after insertion.
  }

  #remove(node: Node<T> | undefined, value: T): Node<T> | undefined {
    if (!node) return undefined;

    const newNode = new Node(node.value, node.priority, node.left, node.right);

    const cmp = this.#comparator(value, newNode.value);
    if (cmp < 0) {
      newNode.left = this.#remove(newNode.left, value);
    } else if (cmp > 0) {
      newNode.right = this.#remove(newNode.right, value);
    } else {
      if (!newNode.left) return newNode.right;
      if (!newNode.right) return newNode.left;

      const minRightNode = this.findMin(newNode.right);
      newNode.value = minRightNode.value; // Update the value with the min value from the right subtree.
      newNode.right = this.removeMin(newNode.right);
    }

    newNode.size =
      1 +
      (newNode.left ? newNode.left.size : 0) +
      (newNode.right ? newNode.right.size : 0); // Recalculate the size.
    return this.#balance(newNode);
  }

  removeMin(node: Node<T>): Node<T> | undefined {
    if (!node.left) return node.right;
    const newNode = new Node(node.value, node.priority);
    newNode.size = node.size - 1;
    newNode.left = this.removeMin(node.left);
    newNode.right = node.right;
    newNode.size =
      1 +
      (newNode.left ? newNode.left.size : 0) +
      (newNode.right ? newNode.right.size : 0); // Recalculate the size.
    return this.#balance(newNode);
  }

  findMin(node: Node<T>): Node<T> {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  #balance(node: Node<T>): Node<T> {
    if (node.right && node.right.priority < node.priority) {
      node = this.#rotateLeft(node);
    }
    if (node.left && node.left.priority < node.priority) {
      node = this.#rotateRight(node);
    }
    return node;
  }

  #rotateLeft(node: Node<T>): Node<T> {
    const newNode = node.right!;
    node.right = newNode.left;
    newNode.left = node;

    newNode.size = node.size;
    node.size =
      1 + (node.left ? node.left.size : 0) + (node.right ? node.right.size : 0);

    return newNode;
  }

  #rotateRight(node: Node<T>): Node<T> {
    const newNode = node.left!;
    node.left = newNode.right;
    newNode.right = node;

    newNode.size = node.size;
    node.size =
      1 + (node.left ? node.left.size : 0) + (node.right ? node.right.size : 0);

    return newNode;
  }

  print() {
    this.#print(this.#root);
  }

  #print(node: Node<T> | undefined) {
    if (!node) return;
    console.log(node);
    if (node.left) {
      this.#print(node.left);
    }
    if (node.right) {
      this.#print(node.right);
    }
  }
}

function* inOrderTraversal<T>(node: Node<T> | undefined): Generator<T> {
  const stack: Node<T>[] = [];
  let currentNode = node;

  while (stack.length > 0 || currentNode) {
    // Reach the left most Node of the current Node
    while (currentNode) {
      stack.push(currentNode);
      currentNode = currentNode.left;
    }

    // currentNode is undefined at this point
    currentNode = stack.pop()!; // Pop the top node, which is the next node in in-order

    yield currentNode.value;

    // Move to the right node
    currentNode = currentNode.right;
  }
}

function* boundedInOrderTraversal<T>(
  comparator: Comparator<T>,
  root: Node<T> | undefined,
  lowerBound: T,
): Generator<T> {
  const stack: Node<T>[] = [];
  let currentNode = root;

  while (stack.length > 0 || currentNode) {
    while (currentNode) {
      if (comparator(currentNode.value, lowerBound) < 0) {
        currentNode = currentNode.right;
      } else {
        stack.push(currentNode);
        currentNode = currentNode.left;
      }
    }

    if (stack.length === 0) {
      return undefined;
    }

    currentNode = stack.pop()!;
    yield currentNode.value;
    currentNode = currentNode.right;
  }
}

function* reverseOrderTraversal<T>(node: Node<T> | undefined): Generator<T> {
  const stack: Node<T>[] = [];
  let currentNode = node;

  while (stack.length > 0 || currentNode) {
    while (currentNode) {
      stack.push(currentNode);
      currentNode = currentNode.right;
    }

    currentNode = stack.pop()!;
    yield currentNode.value;
    currentNode = currentNode.left;
  }
}

function* boundedReverseOrderTraversal<T>(
  comparator: Comparator<T>,
  root: Node<T> | undefined,
  upperBound: T,
): Generator<T> {
  const stack: Node<T>[] = [];
  let currentNode = root;

  while (stack.length > 0 || currentNode) {
    while (currentNode) {
      if (comparator(currentNode.value, upperBound) > 0) {
        currentNode = currentNode.left;
      } else {
        stack.push(currentNode);
        currentNode = currentNode.right;
      }
    }

    currentNode = stack.pop()!;
    yield currentNode.value;
    currentNode = currentNode.left;
  }
}

const empty = new PersistentTreap<unknown>((_l, _r) => 0);
