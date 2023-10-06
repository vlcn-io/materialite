type Node<V> = {
  data: V;
  left: Node<V> | null;
  right: Node<V> | null;
  getChild(isRight: boolean): Node<V> | null;
};

export abstract class TreeBase<V> {
  #root: Node<V> | null = null;
  #size = 0;

  protected abstract _comparator(a: V, b: V): number;

  clear() {
    this.#root = null;
    this.#size = 0;
  }

  get size() {
    return this.#size;
  }

  get root() {
    return this.#root;
  }

  find(data: V) {
    let res = this.#root;

    while (res !== null) {
      const c = this._comparator(data, res.data);
      if (c === 0) {
        return res.data;
      } else {
        res = res.getChild(c > 0);
      }
    }

    return null;
  }

  findIter(data: V) {
    let res = this.#root;
    const iter = this.iterator();

    while (res !== null) {
      const c = this._comparator(data, res.data);
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
    return new Iterator(this);
  }

  lowerBound(data: V) {
    let cur = this.#root;
    const iter = this.iterator();

    while (cur !== null) {
      const c = this._comparator(data, cur.data);
      if (c === 0) {
        iter.cursor = cur;
        return iter;
      }
      iter.ancestors.push(cur);
      cur = cur.getChild(c > 0);
    }

    for (let i = iter.ancestors.length - 1; i >= 0; --i) {
      cur = iter.ancestors[i]!;
      if (this._comparator(data, cur.data) < 0) {
        iter.cursor = cur;
        iter.ancestors.length = i;
        return iter;
      }
    }

    iter.ancestors.length = 0;
    return iter;
  }

  upperBound(data: V) {
    const iter = this.lowerBound(data);

    while (iter.data !== null && this._comparator(iter.data, data) === 0) {
      iter.next();
    }

    return iter;
  }

  min() {
    let res = this.#root;
    if (res === null) {
      return null;
    }

    while (res.left !== null) {
      res = res.left;
    }

    return res.data;
  }

  max() {
    let res = this.#root;
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

class Iterator<V> {
  readonly #tree;
  readonly ancestors: Node<V>[] = [];
  cursor: Node<V> | null = null;

  constructor(tree: TreeBase<V>) {
    this.#tree = tree;
    this.ancestors = [];
    this.cursor = null;
  }

  get data() {
    return this.cursor !== null ? this.cursor.data : null;
  }

  next() {
    if (this.cursor === null) {
      const root = this.#tree.root;
      if (root !== null) {
        this.#minNode(root);
      }
    } else {
      if (this.cursor.right === null) {
        let save: Node<V> | null;
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
    return this.cursor !== null ? this.cursor.data : null;
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
        let save: Node<V> | null;
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

  #minNode(start: Node<V>) {
    while (start.left !== null) {
      this.ancestors.push(start);
      start = start.left;
    }
    this.cursor = start;
  }

  #maxNode(start: Node<V>) {
    while (start.right !== null) {
      this.ancestors.push(start);
      start = start.right;
    }
    this.cursor = start;
  }
}
