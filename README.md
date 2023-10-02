# materialite


# KV

Which key-value store to use?

- https://github.com/spacejam/sled
- Rocks?
- https://github.com/basho/bitcask

# Tutorials
- https://github.com/pingcap/talent-plan/tree/master/courses/rust/projects/project-2
- https://skyzh.github.io/mini-lsm/
- 

# Reading

- https://github.com/frankmcsherry/blog/blob/master/posts/2016-07-17.md
- https://materialize.com/blog/differential-from-scratch/
- DBSP & Feldera paper(s)
- https://github.com/jamii/dida

# The Browser Problem

- Storage calls must be async
- Lack of threads in WASM?
- Want sync diffi flow and async persist? Can we spawn a thread for this? Does dataflow need to be in JS with wasm for persist?

- Can have a relaxed durability write API which queues to persist at some future time or when a strongly durable write is made.

# Requirements

- Non-durable transaction commit
  - Durability is offloaded into the background so we can have synchronous writes
- Select
  - TreeSQL as native dialect
