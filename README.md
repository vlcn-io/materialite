# materialite


# KV

Which key-value store to use?

- https://github.com/spacejam/sled
- Rocks?
- https://github.com/basho/bitcask

# Tutorials
- https://github.com/pingcap/talent-plan/tree/master/courses/rust/projects/project-2
- https://skyzh.github.io/mini-lsm/
- https://github.com/chrislessard/LSM-Tree - Python LSM Tree
- https://www.alibabacloud.com/blog/starting-from-zero-build-an-lsm-database-with-500-lines-of-code_598114

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
- Triple store but allows schema definition
  - Triples segmented into types since triples are predicated of types
  - Types can be created via create table definitions
    - Old triples (representing column values) can be retained even if not in the schema
    - Triples not in the schema can be written
    - Strict mode disables this lax behavior of the 2 bullets above
- CRDT
  - Triple value can have CRDT semantics
  - Create cr-sql like log
  - Uses db_version as value_version
- Create table statement has numbers (like protobufs) to facilitate migration
  - "TABLE" statement rather than "CREATE TABLE" so we just declare the desired schema rather than run a mutation


# Materialization Question

Do we really need it if we're doing only:

- select
- order
- count
- limit
- sub-queries

We can do:
- Where via range trees
- Order via fetching one record before and after and materializing result set
- Count via incr or decr on match or mismatch. Well.. need to know if something previously matching no longer matches. Must have PKs of matching items. Count my use sub-queries via `where exists`
- Disaggregate each into own reactive thing that feeds a graph of other queries...

