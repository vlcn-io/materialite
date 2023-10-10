# materialite

Write "A New DB Architecture for Apps" with Geoffrey?

- Event sourced
- IVM
- Rx
- CRDT rebasing of log(s)

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
- https://www.youtube.com/watch?v=9F4AzqBp8Ng LSM Tree Range Query

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



# Plan

1. LSM Tree
  Key: [type, attr, subj_id]
  Value: value

  - Types encoded as varints as well as attrs to save space. Static mapping from type name to int and attr name to int.
  - Attrs can be subjects themselves with `subj_id` referring to them via key. Type names are stable via indirection to varints.

2. Query language
  - Select, order, count, limit, sub-queries, where clauses, where exists for relational filtering
  - TreeQL

  Compiler, operations / query plan, run operations against indices. Like Aphrodite but against KV store.

  What if you implemented it all with: map, reduce, filter? E.g., Aphrodite / Linq.

3. Range trees and reactivity
  - Simple `where`
  - Sub queries all all each in turn reactive queries that feed into a graph of queries? Changing where bindings or data on the way up

4. Persisting
  - In-memory log created in main thread as db interacted with
  - Log shuttled to worker
  - Worker orders logs received 
  - Worker persists them in turn
  - Any locking? Retries? Read tracking? Rollbacks?
    - Could do read tracking to allow replaying of transaction when clients modify same data.

5. Cross process rx
  - Cross process RX only happens after persist
  - Updates in-memory structures of clients...
  - How to keep consistent across process? Each process independently updating its reactive state. Then
    receiving updates from persister who is actual source of truth. It is another CRDT problem? Each client is trying
    to move forward without coordinating. Coordinating would incur async call in browser.

    Since each client will receive changes from others in a diff order? Or can we ensure same order across all?
    In-mem repr is synced rather than logs? In-mem rep always applies over cross channel rep? Well needs to be logs
    otherwise always syncing full in mem rep? Unless dirty tracking of in mem rep? Dirty in mem precedence? Undirtied when sync starts or when confirmed?

    Dirty ignores updates from RX until dirty is synced. Once dirty is synced, however, we need the official new state?
    Or no since dirty over-wrote anything before it? Yes, that. Persist worker needs to buffer events to send out after persist completes and is acknowledge so client can begin overwrites again.

    Persister itself may have a buffer? Not to disk immediately such that we can sync at high frequency from clients and have
    minimal dirty time.

# Impl Plan

https://www.youtube.com/watch?v=I6jB0nM9SKU

1. Create the mem table which will back the things
2. Mem table is occasionally flushed to disk as writes build up
3. Flushing is sending to persistor who merges together mem tables in defined order. Persistor can do RX via MemTable merge? Rather
   than write event broadcast? Since persistor mem table is correctly ordered. Yes yes :) Simple simple.

Start by reading and writing full mem table to / from disk? Fully in-mem DB to start is what that means.

How are we reading from LSM tree? Building indices and pages and the like...

SSTs need to be binary searchable. This is easily done via a footer that indicates where entries start since entries are var length. The footer is not var length and is used to jump / binary search within our block.
https://skyzh.github.io/mini-lsm/01-block.html

4kb blocks. Load a block into mem at a time. Blocks are loaded if key we are looking for is within block's key range.
We know block key ranges since footers contain tables of starting key of each block. SST is merged trees re-partitioned into
blocks such that the blocks are sequential.

Optimizing reads
  - Summary table storing min/max key ranges of SSTs on disk so we can jump to correct SST.
  - Bloom filter to track if keys do not exist.


# Other Art

- https://github.com/comnik/functional-differential-programming
- http://www.frankmcsherry.org/differential/dataflow/2015/04/07/differential.html
- https://github.com/TimelyDataflow/differential-dataflow/issues/154