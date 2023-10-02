/**
 * Sync works by compacting persistor pages into chunks to be synced.
 * This has the nice feature of collapsing and compressing transactions while
 * still maintaining transactionality.
 * 
 * Can ever-grow but shouldn't grow too much.
 * Apply changes page by page.
 * CRDT metadata in values themselves?
 * Or separate?
 */