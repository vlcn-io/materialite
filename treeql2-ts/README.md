# TreeQL 2

A re-implementation of TreeSQL based on learnings of the past year and to be production grade.


After implementing differential dataflow it appears not that useful for reactivity in an application.
Why?

Well for reactivity we must answer the question of "what query" is impacted by a given write.

Differential dataflow is more for building views from source tables where all those views are fed any updates from all source tables.

While we certainly could create a differential dataflow pipeline for every live query and feed incremental updates to each of
these pipelines, there are some drawbacks:

1. Differential dataflow is rather memory hungry and retains all join information in-memory. We'd have to figure out how to persist these indices in some cases to page them out.
2. It requires seeding with the entire table. If we seed from "query result" we have to start getting rather smart.
3. It scales as O(num_live_queries) as we don't know which live query was impacted only that we should feed the write to all live queries that use the given table. Not so bad considering we're only feeding a single row...

Other:
- We still need a tree representation of state? Or we just allow a ton of `useQuery`


hmm....

Maybe diffi-dataflow isn't so bad. Creating a diffi pipeline per live query. How might we do this well? Without full table seeding?
Maybe we don't worry about synchronous rx.. it'll be fast enough to use db for cross component talk.


----

Simple Sync RX:

1. Parse the queries
  2. Over-select to hydrate that which we need. Mainly just primary keys of final and joined tables.
  3. On change, compare if still match.

  This is our original design. Where we have a query runner that can operate on one row based on available hydrated data.
  This is diffi-dataflow... with short-circuit hydration.