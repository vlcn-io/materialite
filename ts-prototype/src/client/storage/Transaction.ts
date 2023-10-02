/**
 * Represents an ongoing transaction.
 * Contains a MemTree of the current writes taking place in that transaction.
 * 
 * Transactions can be nested so this also contains a pointer to the parent transaction and
 * pointers to child transactions.
 * 
 * Committing a transaction rolls its mem-tree up into the parent.
 * 
 * When the parent transaction is committed:
 * - It is offered to the ReactiveTree
 * - It is sent to the persistor
 * 
 * Reads are always done async and as such go to the persistor worker.
 * Reads that are identical to a reactively maintained query are resolved directly by that query since the results
 * are already in memory and maintained synchronously.
 * 
 */

import { MemTree } from "../../common/MemTree";
import { SubjectKey } from "../schema/Schema";

type RangeOptions = {
  bound?: SubjectKey;
  limit?: number;
};

export interface Tx {
  tx(): Tx;
  commit(): void;
  rollback(): void;
  get(key: SubjectKey): Promise<any>;
  set(key: SubjectKey, value: any): void;
  rm(key: SubjectKey): void;
  getGte(key: SubjectKey, opts?: RangeOptions): Promise<any[]>;
  getLte(key: SubjectKey, opts?: RangeOptions): Promise<any[]>;

  __commit(tx: Tx, memTree: MemTree): void;
  __rollback(tx: Tx): void;
}

export class Transaction implements Tx {
  readonly #parent: Tx;
  readonly #memTree: MemTree;
  readonly #children: Set<Tx> = new Set();

  constructor(parent: Tx) {
    this.#parent = parent;
    this.#memTree = new MemTree();
  }

  tx(): Tx {
    const child = new Transaction(this);
    this.#children.add(child);
    return child;
  }

  commit() {
    if (this.#children.size > 0) {
      throw new Error(`Child transactions are still open. Commit them first.`);
    }
    this.#parent.__commit(this, this.#memTree);
  }

  /**
   * All child transactions are automatically rolled back.
   */
  rollback() {
    this.#parent.__rollback(this);
  }

  get(key: SubjectKey): Promise<any> {
    let ret = this.#memTree.get(key);
    // undefined is a miss
    if (ret === undefined) {
      return this.#parent.get(key);
    }
  }

  set(key: SubjectKey, value: any) {
    this.#memTree.set(key, value);
  }

  rm(key: SubjectKey) {
    this.#memTree.rm(key);
  }

  getGte(key: SubjectKey): any[] {
    return this.#memTree.getGte(key);
  }

  getLte(key: SubjectKey): any[] {
    return this.#memTree.getLte(key);
  }
}