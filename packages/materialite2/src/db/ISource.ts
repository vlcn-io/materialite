import { ITransaction } from "./ITransaction.js";
import { IStream } from "../dbsp/IStream.js";

/**
 * Represents a key-value store that can:
 * 1. Be queried
 * 2. Be updated
 *
 * The source should provide the interface to they key-value
 * store... we should only commit to it on commit?
 * We handle transactions in Materialite then?
 *
 * Or we pass txids? Add those to the interface?
 * Many sources need to be in the same transaction.
 *
 * Sources are part of a higher DB abstraction.
 * The DB abstraction provides transactions...
 *
 * Sources then have WALs keyed on txid.
 * Or maybe a transaction object is passed around?
 * With symbols to key wals for sources?
 *
 */
export interface ISource<E, K = E> {
  readonly stream: IStream;

  add(tx: ITransaction, entity: E): void;
  remove(tx: ITransaction, key: K): void;

  get(tx: ITransaction, key: K): E | undefined;
  after(tx: ITransaction, key: K, inclusive: boolean); // chunk iterable
  before(tx: ITransaction, key: K, inclusive: boolean); // chunk iterable
  between(
    tx: ITransaction,
    start: K,
    end: K,
    includeStart: boolean,
    includeEnd: boolean
  ); // chunk iterable
  getAll(tx: ITransaction); // chunk iterable

  // compact in-flight transaction WALs
  // either up to parent tx or into collection.
  // Prepare for lazy persistence (or whatever persist the source does)
  // Also.. emit events for differential dataflow?
  // ---
  // 1. What if the persist fails and we need to
  // roll back the dataflow results? Just force re-compute them all.
  // 2. How do we emit events?
  // -- source has a difference stream to which we enqueue and
  //    commit phase1/2 things?
  onCommit(tx: ITransaction);
  onRollback(tx: ITransaction);

  // How do we handle rebase due to cross-tab sync?
  // The difference streams need to be re-wound.
  // So... send the inverse of the changes?
  // How do we know how many inverses to keep?
  // Or can the views and operators just use persistent data structures
  // and be moved back to the correct version? To then re-play mutations...
}
