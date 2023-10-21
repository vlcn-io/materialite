export class Node<T> {
  size: number = 1;
  constructor(
    public value: T,
    public priority: number,
    public left: Node<T> | null = null,
    public right: Node<T> | null = null
  ) {}
}

type Comparator<T> = (a: T, b: T) => number;

export class PersistentTreap<T> {
  private comparator: Comparator<T>;
  private root: Node<T> | null = null;

  constructor(comparator: Comparator<T>) {
    this.comparator = comparator;
  }

  get length() {
    return this.root?.size ?? 0;
  }

  get _root() {
    return this.root;
  }

  add(value: T): PersistentTreap<T> {
    const priority = Math.random(); // Random priority
    const root = this._insert(this.root, value, priority);
    const ret = new PersistentTreap(this.comparator);
    ret.root = root;
    return ret;
  }

  delete(value: T): PersistentTreap<T> {
    const root = this._remove(this.root, value);
    const ret = new PersistentTreap(this.comparator);
    ret.root = root;
    return ret;
  }

  clear(): PersistentTreap<T> {
    const ret = new PersistentTreap(this.comparator);
    ret.root = null;
    return ret;
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
      const cmp = this.comparator(value, currentNode.value);

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

    const cmp = this.comparator(value, node.value);

    if (cmp === 0) return true; // Found the value
    if (cmp < 0) return this._contains(node.left, value);
    return this._contains(node.right, value);
  }

  *[Symbol.iterator](): Generator<T> {
    yield* inOrderTraversal(this.root);
  }

  private _insert(node: Node<T> | null, value: T, priority: number): Node<T> {
    if (!node) return new Node(value, priority);

    const cmp = this.comparator(value, node.value);
    let newNode: Node<T>;

    if (cmp < 0) {
      const newLeft = this._insert(node.left, value, priority);
      newNode = new Node(node.value, node.priority, newLeft, node.right);
      newNode.size =
        node.size + (newLeft.size - (node.left ? node.left.size : 0));

      if (newLeft.priority < newNode.priority) {
        return this._rotateRightInsert(newNode);
      }
    } else if (cmp > 0) {
      const newRight = this._insert(node.right, value, priority);
      newNode = new Node(node.value, node.priority, node.left, newRight);
      newNode.size =
        node.size + (newRight.size - (node.right ? node.right.size : 0));

      if (newRight.priority < newNode.priority) {
        return this._rotateLeftInsert(newNode);
      }
    } else {
      newNode = new Node(value, node.priority, node.left, node.right); // Replacement, size remains same
      newNode.size = node.size;
    }
    return newNode;
  }

  private _rotateRightInsert(node: Node<T>): Node<T> {
    const newRoot = node.left!;
    node.left = newRoot.right;
    newRoot.right = node;

    // Update sizes
    node.size =
      1 + (node.left ? node.left.size : 0) + (node.right ? node.right.size : 0);
    newRoot.size =
      1 + (newRoot.left ? newRoot.left.size : 0) + newRoot.right.size;

    return newRoot;
  }

  private _rotateLeftInsert(node: Node<T>): Node<T> {
    const newRoot = node.right!;
    node.right = newRoot.left;
    newRoot.left = node;

    // Update sizes
    node.size =
      1 + (node.left ? node.left.size : 0) + (node.right ? node.right.size : 0);
    newRoot.size =
      1 + newRoot.left.size + (newRoot.right ? newRoot.right.size : 0);

    return newRoot;
  }

  _remove(node: Node<T> | null, value: T): Node<T> | null {
    if (!node) return null;

    let newNode = new Node(node.value, node.priority);
    newNode.size = node.size - 1; // Decrement the size right away.
    newNode.left = node.left;
    newNode.right = node.right;

    const cmp = this.comparator(value, newNode.value);
    if (cmp < 0) {
      newNode.left = this._remove(newNode.left, value);
    } else if (cmp > 0) {
      newNode.right = this._remove(newNode.right, value);
    } else {
      if (!newNode.left) return newNode.right;
      if (!newNode.right) return newNode.left;

      const temp = newNode;
      newNode = this._findMin(temp.right!);
      newNode.right = this._removeMin(temp.right!);
      newNode.left = temp.left;
    }

    newNode.size =
      1 +
      (newNode.left ? newNode.left.size : 0) +
      (newNode.right ? newNode.right.size : 0); // Recalculate the size.
    return this._balance(newNode);
  }

  _removeMin(node: Node<T>): Node<T> | null {
    if (!node.left) return node.right;
    const newNode = new Node(node.value, node.priority);
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

// const treap = new PersistentTreap<number>();
// treap.insert(10);
// const root1 = treap.root; // Version 1

// treap.insert(5);
// const root2 = treap.root; // Version 2

// console.log(root1);
// console.log(root2);
