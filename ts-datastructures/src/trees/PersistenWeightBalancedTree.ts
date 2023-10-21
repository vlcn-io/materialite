// TODO: don't use this. Is not working properly / has bad perf. Probably something wrong with our balancing algorithm

type Comparator<T> = (a: T, b: T) => number;

class TreeNode<T> {
  value: T;
  size: number = 1;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }

  clone(): TreeNode<T> {
    const node = new TreeNode(this.value);
    node.size = this.size;
    node.left = this.left;
    node.right = this.right;
    return node;
  }

  updateSize() {
    this.size =
      1 + (this.left ? this.left.size : 0) + (this.right ? this.right.size : 0);
  }

  get weight(): number {
    return this.size + 1;
  }
}

export class PersistentWeightBalancedTree<T> {
  root: TreeNode<T> | null = null;
  comparator: Comparator<T>;
  private readonly ALPHA: number = 0.25; // Balance factor

  constructor(comparator: Comparator<T>, root?: TreeNode<T> | null) {
    this.comparator = comparator;
    this.root = root || null;
  }

  balance(node: TreeNode<T>): TreeNode<T> {
    const newNode = node.clone();

    const leftWeight = newNode.left ? newNode.left.weight : 1;
    const rightWeight = newNode.right ? newNode.right.weight : 1;

    if (leftWeight < this.ALPHA * newNode.weight) {
      if (
        newNode.right!.left &&
        newNode.right!.left.weight > this.ALPHA * newNode.right!.weight
      ) {
        newNode.right = this.rotateRight(newNode.right!);
      }
      return this.rotateLeft(newNode);
    } else if (rightWeight < this.ALPHA * newNode.weight) {
      if (
        newNode.left!.right &&
        newNode.left!.right.weight > this.ALPHA * newNode.left!.weight
      ) {
        newNode.left = this.rotateLeft(newNode.left!);
      }
      return this.rotateRight(newNode);
    }

    newNode.updateSize();
    return newNode;
  }

  rotateLeft(node: TreeNode<T>): TreeNode<T> {
    const newNode = node.clone();
    const newRoot = newNode.right!.clone();
    newNode.right = newRoot.left;
    newRoot.left = newNode;
    newNode.updateSize();
    newRoot.updateSize();
    return newRoot;
  }

  rotateRight(node: TreeNode<T>): TreeNode<T> {
    const newNode = node.clone();
    const newRoot = newNode.left!.clone();
    newNode.left = newRoot.right;
    newRoot.right = newNode;
    newNode.updateSize();
    newRoot.updateSize();
    return newRoot;
  }

  add(value: T): PersistentWeightBalancedTree<T> {
    const newRoot = this._add(this.root, value);
    return new PersistentWeightBalancedTree(this.comparator, newRoot);
  }

  private _add(node: TreeNode<T> | null, value: T): TreeNode<T> {
    if (!node) return new TreeNode(value);

    const newNode = node.clone();
    const cmp = this.comparator(value, newNode.value);

    if (cmp < 0) {
      newNode.left = this._add(newNode.left, value);
    } else if (cmp > 0) {
      newNode.right = this._add(newNode.right, value);
    } else {
      newNode.value = value;
    }

    newNode.updateSize();
    return this.balance(newNode);
  }

  delete(value: T): PersistentWeightBalancedTree<T> {
    const newRoot = this._delete(this.root, value);
    return new PersistentWeightBalancedTree(this.comparator, newRoot);
  }

  private _delete(node: TreeNode<T> | null, value: T): TreeNode<T> | null {
    if (!node) return null;

    const newNode = node.clone();
    const cmp = this.comparator(value, newNode.value);

    if (cmp < 0) {
      newNode.left = this._delete(newNode.left, value);
    } else if (cmp > 0) {
      newNode.right = this._delete(newNode.right, value);
    } else {
      if (!newNode.left) return newNode.right;
      if (!newNode.right) return newNode.left;

      newNode.value = this._getMax(newNode.left).value;
      newNode.left = this._delete(newNode.left, newNode.value);
    }

    newNode.updateSize();
    return this.balance(newNode);
  }

  private _getMax(node: TreeNode<T>): TreeNode<T> {
    let current = node;
    while (current.right) {
      current = current.right;
    }
    return current;
  }

  at(i: number): T | null {
    return this._atIndex(this.root, i);
  }

  private _atIndex(node: TreeNode<T> | null, i: number): T | null {
    if (!node) return null;

    const leftSize = node.left ? node.left.size : 0;

    if (i < leftSize) {
      return this._atIndex(node.left, i);
    } else if (i == leftSize) {
      return node.value;
    } else {
      return this._atIndex(node.right, i - leftSize - 1);
    }
  }

  // In-order traversal using generator function
  *[Symbol.iterator](): Generator<T> {
    const stack: TreeNode<T>[] = [];
    let currentNode = this.root;

    while (stack.length || currentNode) {
      while (currentNode) {
        stack.push(currentNode);
        currentNode = currentNode.left;
      }

      currentNode = stack.pop()!;
      yield currentNode.value;
      currentNode = currentNode.right;
    }
  }

  forEach(callback: (value: T) => void): void {
    for (let value of this) {
      callback(value);
    }
  }

  map<U>(callback: (value: T) => U): PersistentWeightBalancedTree<U> {
    let newTree = new PersistentWeightBalancedTree<U>(
      this.comparator as unknown as Comparator<U>
    );
    for (let value of this) {
      newTree = newTree.add(callback(value));
    }
    return newTree;
  }

  reduce<U>(reducer: (accumulator: U, value: T) => U, initialValue: U): U {
    let accumulator = initialValue;
    for (let value of this) {
      accumulator = reducer(accumulator, value);
    }
    return accumulator;
  }

  filter(predicate: (value: T) => boolean): PersistentWeightBalancedTree<T> {
    let newTree = new PersistentWeightBalancedTree<T>(this.comparator);
    for (let value of this) {
      if (predicate(value)) {
        newTree = newTree.add(value);
      }
    }
    return newTree;
  }
}
