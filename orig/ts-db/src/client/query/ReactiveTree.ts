/**
 * The ReactiveTree is a normalized tree of triples that is used to represent the results of all reactive queries.
 * 
 * We need to know when to GC entries in this tree
 * so each triple is ref-counted based on what queries are using it.
 * 
 * ReactiveTree can `acceptWrites`. `acceptWrites` take the `MemTree` being committed.
 * All results that pertain to active queries are merged in.
 * 
 * This is where we index queries to understand if:
 * - new inserts should be taken because they match query criteria
 * - existing inserts should be removed because they no longer match query criteria
 * - existing inserts should be updated because they still match query criteria but the data has changed
 */
export class ReactiveTree {

}