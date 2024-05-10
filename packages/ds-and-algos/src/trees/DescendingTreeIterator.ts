import { ConcurrentModificationException } from "../Error.js";
import { INode, ITree } from "../types.js";

export class DescendingTreeIterator<T> implements IterableIterator<T> {
  readonly #tree;
  readonly ancestors: INode<T>[] = [];
  readonly #treeVersion;
  readonly #primed;
  readonly #startNode;
  #first = true;
  cursor: INode<T> | null = null;

  constructor(
    tree: ITree<T>,
    startNode: INode<T> | null = null,
    primed: boolean = true
  ) {
    this.#tree = tree;
    this.#treeVersion = tree.version;
    this.#primed = primed;
    this.#startNode = startNode;
    if (startNode !== null) {
      this.cursor = startNode;
      this.#initializeAncestors(startNode);
    } else {
      this.#initializeCursorAtMax(tree._root);
    }
  }

  #initializeAncestors(node: INode<T>) {
    let current = this.#tree._root;
    while (current !== null && current !== node) {
      this.ancestors.push(current);
      if (this.#tree.comparator(node.value, current.value) < 0) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
  }

  #initializeCursorAtMax(node: INode<T> | null) {
    while (node && node.right !== null) {
      this.ancestors.push(node);
      node = node.right;
    }
    this.cursor = node;
  }

  next(): IteratorResult<T> {
    if (this.#tree.version !== this.#treeVersion) {
      throw new ConcurrentModificationException(
        `Tree modified during iteration which is not allowed.`
      );
    }

    if (this.#primed && this.#first) {
      this.#first = false;
      return {
        done: this.cursor === null,
        value: this.cursor?.value,
      } as IteratorResult<T>;
    }

    if (this.cursor === null) {
      return { done: true, value: undefined };
    }

    const returnedValue = this.cursor.value;
    if (this.cursor.left !== null) {
      this.ancestors.push(this.cursor);
      this.#minNode(this.cursor.left);
    } else {
      while (this.ancestors.length > 0) {
        const ancestor = this.ancestors.pop();
        if (
          !this.ancestors.length ||
          this.ancestors[this.ancestors.length - 1]?.right === ancestor
        ) {
          this.cursor = ancestor ?? null;
          return { done: false, value: returnedValue };
        }
      }
      this.cursor = null; // No more elements to traverse
    }

    return { done: false, value: returnedValue };
  }

  #minNode(start: INode<T>) {
    while (start.right !== null) {
      this.ancestors.push(start);
      start = start.right;
    }
    this.cursor = start;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return new DescendingTreeIterator(
      this.#tree,
      this.#startNode,
      this.#primed
    );
  }
}
