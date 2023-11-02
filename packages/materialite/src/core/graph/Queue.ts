// Queue abstraction that sits between readers and writers.
// This queue understands what version it has sent and will not send old data
// unless explicitly requested to do so.
// E.g., a re-pull would re-set operators and allow old data to be sent.
// re-pulls need to happen if views are attached late to a data stream.
// Those view are missing all the history and so need to issue a re-pull for past data.
