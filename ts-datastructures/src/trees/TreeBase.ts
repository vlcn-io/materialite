export interface INode<V> {
  data: V | null;
  left: INode<V> | null;
  right: INode<V> | null;
  getChild(isRight: boolean): INode<V> | null;
  setChild(isRight: boolean, val: INode<V> | null): void;
}

export abstract class TreeBase<V> {
  _root: INode<V> | null = null;
  _size = 0;

  protected abstract _comparator(a: V, b: V): number;

  // removes all nodes from the tree
  clear() {
    this._root = null;
    this._size = 0;
  }

  get size() {
    return this._size;
  }

  get root() {
    return this._root;
  }

  // returns node data if found, null otherwise
  find(data: V) {
    let res = this._root;

    while (res !== null) {
      const c = this._comparator(data, res.data!);
      if (c === 0) {
        return res.data;
      } else {
        res = res.getChild(c > 0);
      }
    }

    return null;
  }

  // returns iterator to node if found, null otherwise
  findIter(data: V) {
    let res = this._root;
    const iter = this.iterator();

    while (res !== null) {
      const c = this._comparator(data, res.data!);
      if (c === 0) {
        iter.cursor = res;
        return iter;
      } else {
        iter.ancestors.push(res);
        res = res.getChild(c > 0);
      }
    }

    return null;
  }

  iterator() {
    return new TreeIterator(this);
  }

  // Returns an iterator to the tree node at or immediately after the item
  lowerBound(data: V) {
    let cur = this._root;
    const iter = this.iterator();

    while (cur !== null) {
      const c = this._comparator(data, cur.data!);
      if (c === 0) {
        iter.cursor = cur;
        return iter;
      }
      iter.ancestors.push(cur);
      cur = cur.getChild(c > 0);
    }

    for (let i = iter.ancestors.length - 1; i >= 0; --i) {
      cur = iter.ancestors[i]!;
      if (this._comparator(data, cur.data!) < 0) {
        iter.cursor = cur;
        iter.ancestors.length = i;
        return iter;
      }
    }

    iter.ancestors.length = 0;
    return iter;
  }

  // Returns an iterator to the tree node immediately after the item
  upperBound(data: V) {
    const iter = this.lowerBound(data);

    while (iter.data !== null && this._comparator(iter.data!, data) === 0) {
      iter.next();
    }

    return iter;
  }

  // returns null if tree is empty
  min() {
    let res = this._root;
    if (res === null) {
      return null;
    }

    while (res.left !== null) {
      res = res.left;
    }

    return res.data;
  }

  // returns null if tree is empty
  max() {
    let res = this._root;
    if (res === null) {
      return null;
    }

    while (res.right !== null) {
      res = res.right;
    }

    return res.data;
  }

  *each() {
    const iter = this.iterator();
    let data;
    while ((data = iter.next()) !== null) {
      yield data;
    }
  }

  *reach() {
    const iter = this.iterator();
    let data;
    while ((data = iter.prev()) !== null) {
      yield data;
    }
  }
}

class TreeIterator<V> implements IterableIterator<V> {
  readonly #tree;
  readonly ancestors: INode<V>[] = [];
  cursor: INode<V> | null = null;

  constructor(tree: TreeBase<V>) {
    this.#tree = tree;
    this.ancestors = [];
    this.cursor = null;
  }

  get data() {
    return this.cursor !== null ? this.cursor.data : null;
  }

  [Symbol.iterator](): IterableIterator<V> {
    return this;
  }

  next(): IteratorResult<V> {
    if (this.cursor === null) {
      const root = this.#tree.root;
      if (root !== null) {
        this.#minNode(root);
      }
    } else {
      if (this.cursor.right === null) {
        let save: INode<V> | null;
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
      value: this.cursor !== null ? this.cursor.data : null,
    } as IteratorResult<V>;
  }

  // if null-iterator, returns last node
  // otherwise, returns previous node
  prev() {
    if (this.cursor === null) {
      const root = this.#tree.root;
      if (root !== null) {
        this.#maxNode(root);
      }
    } else {
      if (this.cursor.left === null) {
        let save: INode<V> | null;
        do {
          save = this.cursor;
          if (this.ancestors.length) {
            this.cursor = this.ancestors.pop()!;
          } else {
            this.cursor = null;
            break;
          }
        } while (this.cursor.left === save);
      } else {
        this.ancestors.push(this.cursor);
        this.#maxNode(this.cursor.left);
      }
    }
    return this.cursor !== null ? this.cursor.data : null;
  }

  #minNode(start: INode<V>) {
    while (start.left !== null) {
      this.ancestors.push(start);
      start = start.left;
    }
    this.cursor = start;
  }

  #maxNode(start: INode<V>) {
    while (start.right !== null) {
      this.ancestors.push(start);
      start = start.right;
    }
    this.cursor = start;
  }
}
