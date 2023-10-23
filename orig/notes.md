# write priorities

# full log, no compaction...

# derived from log views... -> simple rx above that as views are complex and queries are simple

Purely event sourced architecture with differential dataflow to build up views?
Then basic selects against views for simple rx?

How might we encode the events so it is a compact representation?
- Notion of ephemeral events which only the last is recorded on durable tx.
- Do not auto-persist but persist at app devs indication
- Can we use prolly trees as well? https://docs.dolthub.com/architecture/storage-engine/prolly-tree

- How might we do the CRDT rebasing in this model?
  - Can we re-wind the differential dataflow? Yea... just remove events then re-add events.
    - Or logarithmic snapshots?
    - Determine if full replay vs re-wind then replay based on how far back in time the event is.

# sinks should only notify at end of tx processing