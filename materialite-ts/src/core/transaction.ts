type Parent = {
  commit(): void;
  rollback(): void;
};

export class Transaction {
  readonly #parent;

  constructor(parent: Parent) {
    this.#parent = parent;
  }

  commit() {
    this.#parent.commit();
  }
}
