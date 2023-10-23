import { RBTree } from "@vlcn.io/datastructures-and-algos/RedBlackTree";

export class Table<K, V> {
  // RBTree so we can range query on it
  readonly #tree: RBTree<[K, V]>;

  constructor() {
    this.#tree = new RBTree((l, r) => {
      if (l[0] < r[0]) return -1;
      if (l[0] > r[0]) return 1;
      return 0;
    });
  }

  insert(key: K, value: V) {
    this.#tree.insert([key, value]);
  }

  remove(key: K) {
    this.#tree.remove([key] as any);
  }

  get size() {
    return this.#tree.size;
  }
}
