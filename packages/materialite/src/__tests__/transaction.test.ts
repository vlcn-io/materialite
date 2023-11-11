// effects only run after entire graph has processed a tx
// values don't change at a node? we don't notify downstream
// a signal with many inputs only notifies a single time on tx commit
// a signal with many inputs only runs once rather than once per input
