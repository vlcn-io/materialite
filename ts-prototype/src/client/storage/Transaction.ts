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