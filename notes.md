TODO:

1. Test lazyness (lazy.test.ts)
2. Implement partial "full recompute" to allow for re-materialization
   1. Also allows for pulling in data once something goes missing from a window due to delete
3. Start porting to Strut.io?
4. Clean / prune the APIs?

How might we implement pulling? Such that once limit is hit, upstreams stop computing.

---

- No more eager destructing on normal listener remove
  - but eager on operator remove?
    - I think so. How else would we clean sub-graphs?
- ***

What next...

- get a page
- rematerialize the view from the old view but with a long range. Pull from thee end of the last view.

---

Do we even need the `after` operator anymore? With the new approach to pagination...
Where we take a limited set until the user decides to scroll then we increase the window.

Yes. We still need after so we can resume from leave-off point in scroll

---

When re-sizing

---

Explicit destruction should be fine.

Something higher in the tree destroying a thing is fine since the lower tree is unmounted too.

---

We want to take more as we scroll...

without necessarrily dropping earlier stuff.

So this is an update to `take`? To expand the window?

We could:

- re-build pipeline
- with new `after`

But where do old results go?
How do we cleanly page out old results?
Do we not page them out? Instead retain the prior windows in the virtual table?

Or:

- expand window
- window issues a `pull` for more upstream
  - or does it just resume iterating over its iterator it has from the source?

^- problematic since we are mutating the query. Problematic if we want to return native js structures.

TanStack requires swapping too... Can we swap without fubaring scroll position?
We need buffers.
2 buffers.

On bottom reach, add buffer.
If max buffers, remove buffer.
We render both buffers in the frame.

Buffers are materialized views.

Lower bound constrained to `after`

But what about paging backwards? Need a `before` too?

The easiest thing is to limit @ the view and derive from the view to slowly include more things.
Using a treap so we can grow infinitely. Don't need to create buffers.

---

Source as signal?
ISignal vs IDifferenceSignal?

---

Infinite paginate yourself?
View value should be returned as read only.

---

Demos:

1. Computation playground?

Array -> Array materialization? Sort by received array index.

---

better lazyness / pulling from multisets

We shouldn't notify "regular listeners" until the entire reactive graph has computed itself?

todo:
allow for incremental streams to be taken off of views? I.e., can treat a view as a source itself.
Can also treat a view as an atom for signals.

Change operators to queue pending input instead of pulling when it is missing?

---

Check pull implementation.
Ensure readers are impacted by `pull` too so writers do not send to readers that did not pull.

---

If an operator receives a recompute all passing through it, it should blow away its state.
^-- well the push down and forking problem.

Maybe we keep the simplification of not allowing pushing down from non hoistable stream instances.

Recompute all going only down the requested branch is fine so long as
we don't hit stateful operators which are forked to other branches.

---

How do kanban w/ presence of after?

Not forked off of original query given original one now has paging involved.

Kanban is separate afters with their own filters.

WHERE date > :c_data OR date = :c_date AND id > :c_id ORDER BY date, id

---

When do we become non-hoistable?

a.after
^- hoistable

a.after.filter
^- hoistable but.. if we branch not so much

It is only the recompute all step which faces hoisting problems.
The recompute all step only ever goes down a single path.
so we should always be hoistable if we can always identify this path?

is version based filtering enough though? Or should we pass a nonce down that indicates
what path needs notifying?

---

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

---

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
