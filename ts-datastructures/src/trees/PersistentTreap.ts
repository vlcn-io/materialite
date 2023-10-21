class Node<T> {
  size: number = 0;
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
  private size: number = 0;

  constructor(comparator: Comparator<T>) {
    this.comparator = comparator;
  }

  get length() {
    return this.size;
  }

  add(value: T): PersistentTreap<T> {
    const priority = Math.random(); // Random priority
    const root = this._insert(this.root, value, priority);
    const ret = new PersistentTreap(this.comparator);
    ret.size = this.size + 1;
    ret.root = root;
    return ret;
  }

  delete(value: T): PersistentTreap<T> {
    const root = this._remove(this.root, value);
    const ret = new PersistentTreap(this.comparator);
    ret.size = this.size - 1;
    ret.root = root;
    return ret;
  }

  clear(): PersistentTreap<T> {
    const ret = new PersistentTreap(this.comparator);
    ret.size = 0;
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

    if (cmp < 0) {
      const newLeft = this._insert(node.left, value, priority);
      const newNode = new Node(node.value, node.priority, newLeft, node.right);
      newNode.size =
        node.size + (newLeft.size - (node.left ? node.left.size : 0));

      // Check for rotation
      if (newLeft.priority < newNode.priority) {
        return this._rotateRightInsert(newNode);
      }

      return newNode;
    } else if (cmp > 0) {
      const newRight = this._insert(node.right, value, priority);
      const newNode = new Node(node.value, node.priority, node.left, newRight);
      newNode.size =
        node.size + (newRight.size - (node.right ? node.right.size : 0));

      // Check for rotation
      if (newRight.priority < newNode.priority) {
        return this._rotateLeftInsert(newNode);
      }

      return newNode;
    } else {
      // Duplicate found, replace the current node with the new value
      const newNode = new Node(value, node.priority, node.left, node.right);
      newNode.size = node.size;
      return newNode;
    }
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

  private _remove(node: Node<T> | null, value: T): Node<T> | null {
    if (!node) return null;

    const cmp = this.comparator(value, node.value);

    if (cmp < 0) {
      const newLeft = this._remove(node.left, value);
      const newNode = new Node(node.value, node.priority, newLeft, node.right);
      newNode.size = node.size - 1;
      return newNode;
    } else if (cmp > 0) {
      const newRight = this._remove(node.right, value);
      const newNode = new Node(node.value, node.priority, node.left, newRight);
      newNode.size = node.size - 1;
      return newNode;
    } else {
      if (node.left && node.right) {
        if (node.left.priority > node.right.priority) {
          const newNode = this._rotateRightRemove(node);
          newNode.right = this._remove(newNode.right, value);
          newNode.size = node.size - 1;
          return newNode;
        } else {
          const newNode = this._rotateLeftRemove(node);
          newNode.left = this._remove(newNode.left, value);
          newNode.size = node.size - 1;
          return newNode;
        }
      } else if (node.left) {
        return node.left;
      } else if (node.right) {
        return node.right;
      } else {
        return null;
      }
    }
  }

  private _rotateRightRemove(node: Node<T>): Node<T> {
    const newNode = new Node(
      node.left!.value,
      node.left!.priority,
      node.left!.left,
      node
    );
    newNode.size = node.size;
    node.left = node.left!.right;
    node.size -= 1 + (newNode.left ? newNode.left.size : 0);
    return newNode;
  }

  private _rotateLeftRemove(node: Node<T>): Node<T> {
    const newNode = new Node(
      node.right!.value,
      node.right!.priority,
      node,
      node.right!.right
    );
    newNode.size = node.size;
    node.right = node.right!.left;
    node.size -= 1 + (newNode.right ? newNode.right.size : 0);
    return newNode;
  }
}

function* inOrderTraversal<T>(node: Node<T> | null): Generator<T> {
  if (node) {
    yield* inOrderTraversal(node.left);
    yield node.value;
    yield* inOrderTraversal(node.right);
  }
}

// const treap = new PersistentTreap<number>();
// treap.insert(10);
// const root1 = treap.root; // Version 1

// treap.insert(5);
// const root2 = treap.root; // Version 2

// console.log(root1);
// console.log(root2);
