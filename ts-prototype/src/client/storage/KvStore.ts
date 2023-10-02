import { MemTree } from "../../common/MemTree";
import { AttrNum, Key, Schema, TypeNum, SubjectKey } from "../schema/Schema";
import { Tx } from "./Transaction";

/**
 * KV Store in the client should likey pull pages in...
 * to have them locally in cache.
 * 
 * Or... you can hoist your query to the worker and do all the round-trips there.
 * Well transaction memory isn't in the worker. And the query may apply custom map/reduce functions.
 */
export class KvStore implements Tx {
  readonly #transactions: MemTree[] = [];
  // #schema is used for validating
  // storage key creation.
  // Also maybe for unpacking values?
  // Maybe KV interface is unchecked and we use schema in a layer above?
  // A layer above that generates a query API from the schema.
  readonly #schema: Schema;
  constructor(schema: Schema) {
    this.#schema = schema;
  }

  /**
   * Starts a new transaction
   */
  tx(): Tx {
    
  }

  /**
   * Commits the transaction, rolling 
   * @param txId transaction to commit
   */
  commit() {

  }

  /**
   * 
   * @param txId transaction this read is a part of, if any
   * @param storageKey lookup key
   */
  get(key: SubjectKey) {

  }

  set(key: SubjectKey, value: any) {

  }

  // TODO: numbers and varints and natural sort ordering?
  getGte(key: SubjectKey) {
    // Range check will always go to storage since client only has partially materialized views?
    // Storage may of course have all the pages in cache, however.

    // greater than type:attr:key but less than type:attr+1
  }

  getLte(key: SubjectKey) {

  }

  rm(key: SubjectKey) {

  }

  // Range operators need bounds at the type:attr barrier.
  // Rm is a negative cache and actually removed on sync with persistor.
  // rmGte(txId: number, key: SubjectKey) {
  //   // Maybe do not support range removals to start?
  //   // The issue is it complicates the negative caching quite a bit.
  // }

  // rmLte(txId: number, key: SubjectKey) {}

  storageKeyFromNames(type: string, attr: string, id: Key): SubjectKey {
    throw new Error('unimplemented');
  }
}