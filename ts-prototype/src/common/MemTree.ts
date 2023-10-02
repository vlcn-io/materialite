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

/**
 * Can we do a simple QL for setting values too?
 * Type.pk(:id) { ...attr: Value }
 * Type.new(?:id) { ...attr: Value }
 */
export class MemTree {
  #map: Map<string, any> = new Map();

  constructor() {

  }
}