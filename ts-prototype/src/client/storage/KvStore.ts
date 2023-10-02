import { MemTree } from "../../common/MemTree";
import { AttrNum, Key, Schema, TypeNum, SubjectKey } from "../schema/Schema";

export class KvStore {
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
  tx(): number {
    for (let i = 0; i < this.#transactions.length; i++) {
      if (this.#transactions[i] === undefined) {
        this.#transactions[i] = new MemTree();
        return i;
      }
    }

    const txId = this.#transactions.length;
    this.#transactions.push(new MemTree());
    return txId;
  }

  /**
   * Commits the transaction, rolling 
   * @param txId transaction to commit
   */
  commit(txId: number) {

  }

  /**
   * 
   * @param txId transaction this read is a part of, if any
   * @param storageKey lookup key
   */
  get(txId: number, key: SubjectKey) {

  }

  set(txId: number, key: SubjectKey, value: any) {

  }

  // TODO: numbers and varints and natural sort ordering?
  getGte(txId: number, key: SubjectKey) {
    // Range check will always go to storage since client only has partially materialized views?
    // Storage may of course have all the pages in cache, however.
  }

  getLte(txId: number, key: SubjectKey) {

  }

  rm(txId: number, key: SubjectKey) {

  }

  // Range operators need bounds at the type:attr barrier.
  // Rm is a negative cache and actually removed on sync with persistor.
  rmGte(txId: number, key: SubjectKey) {

  }

  rmLte(txId: number, key: SubjectKey) {

  }

  storageKeyFromOrdinals(type: TypeNum, attr: AttrNum, id: Key): SubjectKey {
    // validate that attr exists in type?
    throw new Error('unimplemented');
  }

  storageKeyFromNames(type: string, attr: string, id: Key): SubjectKey {
    throw new Error('unimplemented');
  }
}