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
import { mergeSort } from "../../common/sorting";
import { IndexKey, Value } from "../schema/Schema";

export type RangeOptions = {
  bound?: IndexKey;
  limit?: number;
};

export interface Tx {
  tx(): Tx;
  commit(): void;
  rollback(): void;
  get(key: IndexKey): Promise<Value>;
  set(key: IndexKey, value: Value): void;
  rm(key: IndexKey): void;
  getGte(
    key: IndexKey,
    opts?: RangeOptions
  ): Promise<(readonly [IndexKey, Value])[]>;
  getLte(
    key: IndexKey,
    opts?: RangeOptions
  ): Promise<(readonly [IndexKey, Value])[]>;

  __commitChild(tx: Tx, memTree: MemTree): void;
  __rollbackChild(tx: Tx): void;
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
    this.#parent.__commitChild(this, this.#memTree);
  }

  /**
   * All child transactions are automatically rolled back.
   */
  rollback() {
    this.#parent.__rollbackChild(this);
  }

  get(key: IndexKey): Promise<Value> {
    let ret = this.#memTree.get(key);
    // undefined is a miss
    if (ret === undefined) {
      return this.#parent.get(key);
    }

    return ret;
  }

  set(key: IndexKey, value: Value) {
    this.#memTree.set(key, value);
  }

  rm(key: IndexKey) {
    this.#memTree.rm(key);
  }

  getGte(
    key: IndexKey,
    opts?: RangeOptions
  ): Promise<(readonly [IndexKey, Value])[]> {
    return this.#getRange(key, opts || {}, "getGte");
  }

  getLte(
    key: IndexKey,
    opts?: RangeOptions
  ): Promise<(readonly [IndexKey, Value])[]> {
    return this.#getRange(key, opts || {}, "getLte");
  }

  #getRange(
    key: IndexKey,
    opts: RangeOptions,
    op: "getGte" | "getLte"
  ): Promise<(readonly [IndexKey, Value])[]> {
    let accumulation = this.#memTree[op](key);
    opts = opts ?? {};
    if (opts.limit !== undefined && accumulation.length >= opts.limit) {
      return Promise.resolve(accumulation);
    }
    return this.#parent
      [op](key, {
        bound: opts.bound,
        limit:
          opts.limit === undefined
            ? undefined
            : opts.limit - accumulation.length,
      })
      .then((parentResults) => {
        // merge accumulation and parent results
        return mergeSort(accumulation, parentResults);
      });
  }

  __commitChild(tx: Tx, memTree: MemTree) {
    if (this.#children.delete(tx) === false) {
      throw new Error(
        `Trying to commit a child which does not belong to this parent`
      );
    }
    this.#memTree.merge(memTree);
  }

  __rollbackChild(tx: Tx) {
    if (this.#children.delete(tx) === false) {
      throw new Error(
        `Trying to rollback a child which does not belong to this parent`
      );
    }
  }
}
