export type Comparator<T> = (a: T, b: T) => number;

type NodeLike<T> = {
  left: Node<T> | null;
  right: Node<T> | null;
  size: number;
};

class Node<T> {
  constructor(
    public readonly value: T,
    // Ideally these would all be read-only but the recursive nature of delete and add currently prevent this.
    public left: Node<T> | null,
    public right: Node<T> | null,
    public size: number = 1
  ) {}

  static fromNode<T>(n: Node<T>) {
    return new Node(n.value, n.left, n.right, n.size);
  }

  static maybeFromNode<T>(n: Node<T> | null): Node<T> | null {
    if (n == null) {
      return n;
    }
    return new Node(n.value, n.left, n.right, n.size);
  }
}

// https://dl.acm.org/doi/pdf/10.1145/274787.274812
/**
 * A randomized binary search tree.
 * Balanced via randomization. Expected height is O(log n).
 * The larger the tree, the more likely it is to be perfectly balanced.
 *
 * The advantange of randomization is that it is simple to implement and
 * has a lower constant factor than other balanced BSTs.
 *
 * The randomization algorithm is also based on node size -- information
 * we need to retain in order to index the tree as an array anyway.
 */
export class RandomBST<T> {
  constructor(
    private comparator: Comparator<T>,
    private readonly root: Node<T> | null = null
  ) {}

  get size() {
    return this.root?.size ?? 0;
  }

  add(value: T): RandomBST<T> {
    return new RandomBST(
      this.comparator,
      add(this.root, this.comparator, value)
    );
  }

  delete(value: T): RandomBST<T> {
    if (this.root == null) {
      return this;
    }

    let newRoot = Node.fromNode(this.root);
    newRoot = delete_(newRoot, this.comparator, value)!;
    newRoot.size = (newRoot.left?.size ?? 0) + (newRoot.right?.size ?? 0) + 1;
    return new RandomBST(this.comparator, newRoot);
  }
}

// root is an original tree node, not a copy.
function add<T>(
  root: Node<T> | null,
  comparator: Comparator<T>,
  value: T
): Node<T> {
  if (!root) {
    return new Node(value, null, null);
  }

  const r = Math.floor(Math.random() * root.size);
  if (r === root.size) {
    return addAtRoot(root, comparator, value);
  }

  const comparison = comparator(value, root.value);
  if (comparison < 0) {
    const ret = new Node(
      root.value,
      add(root.left, comparator, value),
      root.right
    );
    const oldLeft = root.left;
    const newLeft = ret.left;
    ret.size =
      (newLeft?.size ?? 0) -
      (oldLeft?.size ?? 0) +
      (root.right?.size ?? 0) +
      (newLeft?.size ?? 0);
    return ret;
  } else if (comparison > 0) {
    const ret = new Node(
      root.value,
      root.left,
      add(root.right, comparator, value)
    );
    const oldRight = root.right;
    const newRight = ret.right;
    ret.size =
      (newRight?.size ?? 0) -
      (oldRight?.size ?? 0) +
      (root.left?.size ?? 0) +
      (newRight?.size ?? 0);
    return ret;
  } else {
    return new Node(value, root.left, root.right, root.size);
  }
}

// root is a copy of a tree node, not an original.
function delete_<T>(
  root: Node<T> | null,
  comparator: Comparator<T>,
  value: T
): Node<T> | null {
  if (root == null) {
    return root;
  }

  const comparison = comparator(value, root.value);
  if (comparison < 0) {
    const left = root.left;
    if (left) {
      const newLeft = Node.fromNode(left);
      root.left = delete_(newLeft, comparator, value);
      // TOOD: update size?
    }
  } else if (comparison > 0) {
    const right = root.right;
    if (right) {
      const newRight = Node.fromNode(right);
      root.right = delete_(newRight, comparator, value);
      // TOOD: update size?
    }
  } else {
    // We return the join of the left and right subtrees of the current node.
    // This eliminates the current node from the tree as it is not present in the join
    // of its subtrees.
    let newLeft: Node<T> | null = null;
    let newRight: Node<T> | null = null;
    if (root.left != null) {
      newLeft = Node.fromNode(root.left);
    }
    if (root.right != null) {
      newRight = Node.fromNode(root.right);
    }
    return join(newLeft, newRight);
  }

  return root;
}

function addAtRoot<T>(root: Node<T>, comp: Comparator<T>, value: T): Node<T> {
  const leftTreeRef = new RightRef<T>();
  const rightTreeRef = new LeftRef<T>();
  split(root, comp, value, leftTreeRef, rightTreeRef);
  const leftTree = leftTreeRef.get();
  const rightTree = rightTreeRef.get();

  const ret = new Node(value, leftTree, leftTree);
  ret.size = (leftTree?.size ?? 0) + (rightTree?.size ?? 0) + 1;
  return ret;
}

function split<T>(
  // Root is an original tree node, not a copy.
  root: Node<T> | null,
  comp: Comparator<T>,
  value: T,
  leftTree: RightRef<T>,
  rightTree: LeftRef<T>
) {
  if (root == null) {
    return;
  }

  const comparison = comp(value, root.value);
  const n = Node.fromNode(root);
  if (comparison < 0) {
    rightTree.update(n);
    split(root.left, comp, value, leftTree, new LeftRef(n));
  } else {
    leftTree.update(n);
    split(root.right, comp, value, new RightRef(n), rightTree);
  }
}

// Left and Right are copies of tree nodes, not originals
function join<T>(left: Node<T> | null, right: Node<T> | null): Node<T> | null {
  if (left == null) {
    return right;
  }
  if (right == null) {
    return left;
  }

  let m = left.size;
  let n = right.size;
  let total = m + n;

  let r = Math.floor(Math.random() * (total - 1));
  if (r < m) {
    let newLeftRight = Node.maybeFromNode(left.right);
    left.right = join(newLeftRight, right);
    return left;
  } else {
    let newRightLeft = Node.maybeFromNode(right.left);
    right.left = join(left, newRightLeft);
    return right;
  }
}

class LeftRef<T> {
  constructor(private n: NodeLike<T> = { left: null, right: null, size: 0 }) {}

  update(o: Node<T> | null) {
    if (o == null) {
      return;
    }

    this.n.left = new Node(o.value, o.left, o.right);
    this.n.size = (this.n.left?.size ?? 0) + (this.n.right?.size ?? 0) + 1;
  }

  get() {
    return this.n.left;
  }
}

class RightRef<T> {
  constructor(private n: NodeLike<T> = { left: null, right: null, size: 0 }) {}

  update(o: Node<T> | null) {
    if (o == null) {
      return;
    }

    this.n.right = new Node(o.value, o.left, o.right);
    this.n.size = (this.n.left?.size ?? 0) + (this.n.right?.size ?? 0) + 1;
  }

  get() {
    return this.n.right;
  }
}
