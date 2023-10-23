export type Comparator<T> = (a: T, b: T) => number;

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
export class ImmRandomBST<T> {
  constructor(
    private comparator: Comparator<T>,
    private readonly root: Node<T> | null = null
  ) {}

  get size() {
    return this.root?.size ?? 0;
  }

  actualDepth_expensive() {
    return depth(this.root);
  }

  likelyDepth() {
    return Math.floor(Math.log2(this.size));
  }

  add(value: T): ImmRandomBST<T> {
    return new ImmRandomBST(
      this.comparator,
      add(this.root, this.comparator, value)
    );
  }

  has(value: T): boolean {
    let node = this.root;
    while (node != null) {
      const comparison = this.comparator(value, node.value);
      if (comparison < 0) {
        node = node.left;
      } else if (comparison > 0) {
        node = node.right;
      } else {
        return true;
      }
    }
    return false;
  }

  *[Symbol.iterator]() {
    const stack: Node<T>[] = [];
    let node = this.root;
    while (node != null || stack.length > 0) {
      while (node != null) {
        stack.push(node);
        node = node.left;
      }

      node = stack.pop()!;
      yield node.value;
      node = node.right;
    }
  }

  delete(value: T): ImmRandomBST<T> {
    if (this.root == null) {
      return this;
    }

    let newRoot = Node.fromNode(this.root);
    newRoot = delete_(newRoot, this.comparator, value)!;
    newRoot.size = (newRoot.left?.size ?? 0) + (newRoot.right?.size ?? 0) + 1;
    return new ImmRandomBST(this.comparator, newRoot);
  }

  // at(index: number)
  // [Symbol.iterator]
  // has
  // map
  // forEach
  // reduce
  // filter
  // find
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

  const comparison = comparator(value, root.value);
  if (comparison == 0) {
    return new Node(value, root.left, root.right, root.size);
  }
  const r = Math.round(Math.random() * root.size) | 0;
  if (r == root.size) {
    // TODO: if it is already in the tree we don't want to do anything.
    // so we should search for an existing value before adding.
    // or update `addAtRoot` to do a replace if the value already exists.
    return addAtRoot(root, comparator, value);
  }

  if (comparison < 0) {
    const ret = new Node(
      root.value,
      add(root.left, comparator, value),
      root.right
    );
    ret.size = (ret.left?.size ?? 0) + (ret.right?.size ?? 0) + 1;
    return ret;
  } else {
    const ret = new Node(
      root.value,
      root.left,
      add(root.right, comparator, value)
    );
    ret.size = (ret.left?.size ?? 0) + (ret.right?.size ?? 0) + 1;
    return ret;
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

// root is the original tree
export function addAtRoot<T>(
  root: Node<T>,
  comp: Comparator<T>,
  value: T
): Node<T> {
  const newRoot = new Node(value, null, null);
  split(root, comp, value, new LeftRef(newRoot), new RightRef(newRoot));
  newRoot.size = (newRoot.left?.size ?? 0) + (newRoot.right?.size ?? 0) + 1;
  return newRoot;
}

// todo: handle equality
// root is an original node
function split<T>(
  root: Node<T> | null,
  comp: Comparator<T>,
  value: T,
  leftTree: LeftRef<T> | RightRef<T>,
  rightTree: LeftRef<T> | RightRef<T>
) {
  if (root == null) {
    leftTree.update(null);
    rightTree.update(null);
    return;
  }

  const comparison = comp(value, root.value);
  if (comparison < 0) {
    const node = Node.fromNode(root);
    rightTree.update(node);

    split(root.left, comp, value, leftTree, new LeftRef(node));
    node.size = (node.left?.size ?? 0) + (node.right?.size ?? 0) + 1;
  } else if (comparison > 0) {
    const node = Node.fromNode(root);
    leftTree.update(node);

    split(root.right, comp, value, new RightRef(node), rightTree);
    node.size = (node.left?.size ?? 0) + (node.right?.size ?? 0) + 1;
  } else {
    // delete this entry from the split by skipping to children.
    leftTree.update(root.left);
    rightTree.update(root.right);
    // we're done. All things left of value are in leftTree, all things right of value are in rightTree.
    return;
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

function depth<T>(node: Node<T> | null): number {
  if (!node) return 0;
  return 1 + Math.max(depth(node.left), depth(node.right));
}

class LeftRef<T> {
  constructor(private n: NodeLike<T>) {}

  update(o: Node<T> | null) {
    this.n.left = o;
  }

  get() {
    return this.n.left;
  }
}

class RightRef<T> {
  constructor(private n: NodeLike<T>) {}

  update(o: Node<T> | null) {
    this.n.right = o;
  }

  get() {
    return this.n.right;
  }
}

type NodeLike<T> = {
  left: Node<T> | null;
  right: Node<T> | null;
  size: number;
};

export class Node<T> {
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
