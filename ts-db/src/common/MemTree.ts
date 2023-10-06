/**
 * In-memory tree of current writes not yet persisted and hydrated reactive query results.
 *
 * MemTrees are in levels:
 * 1. Ongoing transactions
 * 2. Committed transactions not yet persisted
 * 3. Normalized triples of query results from reactive queries (ReactiveTree, not MemTree)
 * 4. Merging of trees send by clients to the persistor
 *
 * MemTrees merge down into lower levels.
 *
 * Ongoing transaction(s) commit into (2) and (3).
 * (3) does not roll into anything as it represents a read state rather than something to write. Merging (2) into (3) is also
 * where reactivity happens. Writes that have no active read are not allowed into (3). Things can be evicted from (3) if they are
 * pushed out by other writes e.g., due to queries having limits on them.
 * (2) commits into (4) when the persistor is ready to accept the write.
 *
 * Persistor sends state to other threads too... The merge delta of (2) -> (4) gets reported to other threads...
 * This merge delta goes into (3) on other threads as we only are concerned with reactivity here and do not need
 * to flush back to persist again as it is coming from the persist layer.
 *
 */

import { IndexKey } from "../client/schema/Schema";
import { RangeOptions } from "../client/storage/Transaction";

/**
 * Can we do a simple QL for setting values too?
 * Type.pk(:id) { ...attr: Value }
 * Type.new(?:id) { ...attr: Value }
 */
export class MemTree {
  rm(_key: any) {
    throw new Error("Method not implemented.");
  }
  set(_key: IndexKey, _value: any) {
    throw new Error("Method not implemented.");
  }
  merge(_memTree: MemTree) {
    throw new Error("Method not implemented.");
  }
  getGte(_key: IndexKey, _opts?: RangeOptions): any {
    throw new Error("Method not implemented.");
  }
  getLte(_key: IndexKey, _opts?: RangeOptions): any {}
  // #leastKey: IndexKey | null = null;
  // TODO: this needs to be a TreeMap so we can do range requests!
  #map: Map<IndexKey, any> = new Map();

  constructor() {}

  get(key: IndexKey): any {
    return this.#map.get(key);
  }
}
