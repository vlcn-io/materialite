import { MemTree } from "../../common/MemTree";
import { Key, IndexKey, Schema, Value } from "../schema/Schema";
import { RangeOptions, Transaction, Tx } from "./Transaction";

/**
 * KV Store in the client should likey pull pages in...
 * to have them locally in cache.
 *
 * Or... you can hoist your query to the worker and do all the round-trips there.
 * Well transaction memory isn't in the worker. And the query may apply custom map/reduce functions.
 */
export class KvStore implements Tx {
  readonly #childTransactions: Tx[] = [];
  // #schema is used for validating
  // storage key creation.
  // Also maybe for unpacking values?
  // Maybe KV interface is unchecked and we use schema in a layer above?
  // A layer above that generates a query API from the schema.
  // readonly #schema: Schema;
  constructor(_schema: Schema) {
    // this.#schema = schema;
  }

  /**
   * Starts a new transaction
   */
  tx(): Tx {
    const child = new Transaction(this);
    this.#childTransactions.push(child);
    return child;
  }

  /**
   * Commits the transaction, rolling
   * @param txId transaction to commit
   */
  commit() {}

  rollback() {}

  __commitChild(_tx: Tx, _memTree: MemTree) {}

  __rollbackChild(_tx: Tx) {}

  /**
   *
   * @param txId transaction this read is a part of, if any
   * @param storageKey lookup key
   */
  get(_key: IndexKey): Promise<Value> {
    throw new Error("unimplemented");
  }

  set(_key: IndexKey, _value: any) {}

  // TODO: numbers and varints and natural sort ordering?
  getGte(
    _key: IndexKey,
    _opts?: RangeOptions
  ): Promise<(readonly [IndexKey, Value])[]> {
    // Range check will always go to storage since client only has partially materialized views?
    // Storage may of course have all the pages in cache, however.
    // greater than type:attr:key but less than type:attr+1
    throw new Error("unimplemented");
  }

  getLte(
    _key: IndexKey,
    _opts?: RangeOptions
  ): Promise<(readonly [IndexKey, Value])[]> {
    throw new Error("unimplemented");
  }

  rm(_key: IndexKey) {}

  // Range operators need bounds at the type:attr barrier.
  // Rm is a negative cache and actually removed on sync with persistor.
  // rmGte(txId: number, key: SubjectKey) {
  //   // Maybe do not support range removals to start?
  //   // The issue is it complicates the negative caching quite a bit.
  // }

  // rmLte(txId: number, key: SubjectKey) {}

  storageKeyFromNames(_type: string, _attr: string, _id: Key): IndexKey {
    throw new Error("unimplemented");
  }
}
