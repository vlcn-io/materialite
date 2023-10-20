class Node<T> {
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

  // addOrReplace(value: T): PersistentTreap<T> {
  // TODO: return if replaced or not
  //   const root = this._replace(this.root, value);
  //   const ret = new PersistentTreap(this.comparator);
  //   ret.size = this.size + 1;
  //   ret.root = root;
  //   return ret;
  // }

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

  // private _replace(node: Node<T> | null, value: T): Node<T> | null {
  //   if (!node) {
  //     return new Node(value, Math.random()); // New node
  //   }

  //   const cmp = this.comparator(value, node.value);

  //   if (cmp < 0) {
  //     const newLeft = this._replace(node.left, value);
  //     return new Node(node.value, node.priority, newLeft, node.right);
  //   } else if (cmp > 0) {
  //     const newRight = this._replace(node.right, value);
  //     return new Node(node.value, node.priority, node.left, newRight);
  //   } else {
  //     // Node is found, replace its value
  //     return new Node(value, node.priority, node.left, node.right);
  //   }
  // }

  *[Symbol.iterator](): Generator<T> {
    yield* inOrderTraversal(this.root);
  }

  private _remove(node: Node<T> | null, value: T): Node<T> | null {
    if (!node) return null;

    const cmp = this.comparator(value, node.value);

    if (cmp < 0) {
      const newLeft = this._remove(node.left, value);
      return new Node(node.value, node.priority, newLeft, node.right);
    } else if (cmp > 0) {
      const newRight = this._remove(node.right, value);
      return new Node(node.value, node.priority, node.left, newRight);
    } else {
      // The node to be removed is found
      if (node.left && node.right) {
        if (node.left.priority > node.right.priority) {
          const rotated = this._rotateRight(node, node.left);
          rotated.right = this._remove(rotated.right, value);
          return rotated;
        } else {
          const rotated = this._rotateLeft(node, node.right);
          rotated.left = this._remove(rotated.left, value);
          return rotated;
        }
      } else if (node.left) {
        return node.left;
      } else if (node.right) {
        return node.right;
      } else {
        return null; // Node is a leaf
      }
    }
  }

  private _insert(node: Node<T> | null, value: T, priority: number): Node<T> {
    if (!node) {
      return new Node(value, priority);
    }

    const cmp = this.comparator(value, node.value);

    if (cmp < 0) {
      const newLeft = this._insert(node.left, value, priority);
      if (newLeft.priority > node.priority) {
        return this._rotateRight(node, newLeft);
      }
      return new Node(node.value, node.priority, newLeft, node.right);
    } else if (cmp > 0) {
      const newRight = this._insert(node.right, value, priority);
      if (newRight.priority > node.priority) {
        return this._rotateLeft(node, newRight);
      }
      return new Node(node.value, node.priority, node.left, newRight);
    }

    // No duplicates allowed in this example
    return node;
  }

  private _rotateRight(y: Node<T>, x: Node<T>): Node<T> {
    return new Node(
      x.value,
      x.priority,
      x.left,
      new Node(y.value, y.priority, x.right, y.right)
    );
  }

  private _rotateLeft(x: Node<T>, y: Node<T>): Node<T> {
    return new Node(
      y.value,
      y.priority,
      new Node(x.value, x.priority, x.left, y.left),
      y.right
    );
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
