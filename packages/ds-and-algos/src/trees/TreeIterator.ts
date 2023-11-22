import { ConcurrentModificationException } from "../Error.js";
import { INode, ITree } from "../types.js";

export class TreeIterator<T> implements IterableIterator<T> {
  readonly #tree;
  readonly ancestors;
  readonly #treeVersion;
  readonly #primed;
  #first = true;
  cursor;

  constructor(
    tree: ITree<T>,
    primed: boolean = true,
    ancestors: INode<T>[] = [],
    cursor: INode<T> | null = null
  ) {
    this.#tree = tree;
    this.ancestors = ancestors;
    this.cursor = cursor;
    this.#treeVersion = tree.version;
    this.#primed = primed;
  }

  get data() {
    return this.cursor !== null ? this.cursor.value : null;
  }

  [Symbol.iterator](): IterableIterator<T> {
    // Return a new copy of this iterator so we don't exhaust the iterator
    // when other people want to iterate it.
    return new TreeIterator(
      this.#tree,
      this.#primed,
      [...this.ancestors],
      this.cursor
    );
  }

  next(): IteratorResult<T> {
    if (this.#tree.version !== this.#treeVersion) {
      throw new ConcurrentModificationException(
        `Tree modified during iteration which is not allowed.`
      );
    }

    // So we can respect JS behavior for iterators. Where `next` must be called to move to the first element
    // and an iterator should not already be on the first element.
    if (this.#primed && this.#first) {
      this.#first = false;
      return {
        done: this.cursor === null ? true : false,
        value: this.cursor !== null ? this.cursor.value : null,
      } as IteratorResult<T>;
    }

    if (this.cursor === null) {
      const root = this.#tree._root;
      if (root !== null) {
        this.#minNode(root);
      }
    } else {
      if (this.cursor.right == null) {
        let save: INode<T> | null;
        do {
          save = this.cursor;
          if (this.ancestors.length) {
            this.cursor = this.ancestors.pop()!;
          } else {
            this.cursor = null;
            break;
          }
        } while (this.cursor.right === save);
      } else {
        this.ancestors.push(this.cursor);
        this.#minNode(this.cursor.right);
      }
    }
    return {
      done: this.cursor === null,
      value: this.cursor !== null ? this.cursor.value : null,
    } as IteratorResult<T>;
  }

  #minNode(start: INode<T>) {
    while (start.left !== null) {
      this.ancestors.push(start);
      start = start.left;
    }
    this.cursor = start;
  }
}

/**
 * Finding an iter involves:
 * - finding the first thing greater than X
 * - save the first greater we see
 *  - once we've found a greater we can look for closer greaters
 *  - save ancestors on this search
 *  - if we hit a lesser, last ancestor is the next greater
 * - if we hit a greater, last ancestor is the next lesser
 * - in-order traversal from that ancestor + its ancestors
 */
