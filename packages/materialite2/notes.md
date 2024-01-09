- Operators
- Inputs and outputs
- Message passing along the graph

What is currently wrong?

- Recomputes?
- Partial recomputes?
- Destructing?
- Arbitrary hoisting?

Is hoisting hard when we have this incremental flow?

Hoisting is only needed for initial seed.
Hoisting filters can be a problem? If we fork off.

---

- Operators
- Queues between operators?
- Duplicate graph structure determination?
  - Graph sharing?
- Partial and full recompute
- Source order? First join order?
- No final comparator? Unless explicitly required?
  - Keyed and source order for computation... makes dupes / vanilla ints easy to deal with

---

Having storage changes some things...
Storage is key based and key-range based, no comparators.

So sources should be ordered-by-key which should match on-disk index or collection.

Loading from disk is also async.. so there's that issue when reading from sources.
