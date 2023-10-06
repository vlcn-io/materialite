export class Table<K, V> {
  // RBTree so we can range query on it
  readonly #entries: Map<K, V>;

  constructor() {
    this.#entries = new Map();
  }
}
