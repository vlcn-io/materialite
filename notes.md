This whole "message passing from view to source" and accumulating data at each operator is very much like your
Aphrodite query builder (https://tantaman.com/2022-05-26-query-planning.html).

We accumulate operations and push them into the source expression such that we can do efficient re-computation.

So we could take "typed filters"
`filter('field', eq, val)`

---

Each operator? stream? needs to know its last seen version.
We should ignore data if its version is before our last seen version. E.g., recomputation events.


---
Can we really do this incremental pagination?

// Default materialize methods assume same order as source.
// materialize window returns a window into the materialization that we can slide around...
s.filter.map.materializeWindow();
s.filter.map.materialize();

// fluent api to construct the view?
s.filter().map().view.after(x).first(y).materialize()
// sliding view is same as re-constructing the materialization
// but we have extra params with which to call the source.
// mainly the after. We'll stop pulling from source once `first` is consumed.

How can we fork different views with different ranges against the source?
They all have different query criteria against the source.

If it is a pull model we can simply stop consuming the source iterator once we've consumed `first`.
`first` is a stream operator which understands when things are in/out of the window and to drop or not.

So first likely needs to also take an `after` since we need to understand both components to maintain the window
in the stream operator itself.

or `after` must come before `first` in a stream operator?
`after` could enrich requests for `recomputeAll`? We're sending info down the stream and tacking metadata on about
what we need.

Maybe attaching a view can pass down a cursor for the `recomputeAll` piece?

So we have:

// after and first would require sorting takes place at the source.
// after should likely come before any filters...
// so we can jump to that place in the source stream
// this is information we could push down into the source expression.
s.filter().map().after(x).first(y).materialize()

// after is a partial of T for use by comparator?

Support a general message passing structure down the pipeline to the source?

----

Maybe we should weakly hold materialized views? And if the view is GC'ed we can clean up the pipeline leading to it.

Limits, sorts, offsets...

If we materialize
- Into a mutable JS structure
- Into a new copy of a JS structure

We need limits. First case due to ordering if we insert or remove items.

Order the source.

We still need a comparator for the result so we know where in the materialized view to place diffs.

stream.first()...
stream.filter().map().first() 

first or take?

How do we paginate if the stream only took N?

stream.after(cursor)

We aren't maintaining everything. So a change in cursor is a re-run.

I like unlimited views and then limiting on our view of the view...
^- does this make filter changes expensive though?

We can provide both capabilities.

Document both...