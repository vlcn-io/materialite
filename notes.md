# todo

- full test suite
- hoisted filter
- source with hoisting interface

Is a hoisted filter a problem?

- for joins? no.. if it isn't there it isn't there. User must put filter before join or other operators that could cause problems.

Can you do a comment example without hoisting?
Or with your current after? after and before? after and until? Prefix scan?

```ts
comment: {
  id,
  issue_id,
  created_time
}

comparator() {
  by issue_id
  by created_time
  by id
}

after(Partial<Comment>)
```

The source is sorted be we don't know _how_ it is sorted.
Can we recreate a partial equality with a comparator?

Hmm... After looks up from the treap the lower bound.
Presumably the comparator could handle undefined or sentinel values to match ranges of things and we can hack `after` to become `filter`
Well we need to know when to stop... and take won't do that for us.

```ts
filter(Partial<Comment>);
```

We could return an iterator bounded by upper and lower bound via comparator hacking.

# re-write the reactive graph

Transactions have three stages:

1. enqueue values
2. run computations (currently called `notify`)
3. notify observers (currerntly called `notifyCommitted`)

(1) has a special case where we must deal with "recomputes". This is currently bolted on as a hack.

- Recomputes can be abstracted behind data version information and/or frontiers?
  - Recomputes can be sent at current version
  - Operators that have already processed up to the current version will ignore the data
  - We do, however, have to invalidate certain nodes of the graph. Pushing their version to 0 when a recompute
    is requested down their path.
    - Maybe not push to 0 but indicate that the path is ready to receive the same version over again? This is related to partial recomputes below.

So that's recompute.

What about a partial recompute? This is not a problem for linear operators but for operators with memory...
Options:

1. Send retractions for data that is about to be re-sent
2. Simplify everything by assuming uniqueness off values
3. Special case metadata to indicate a message is duplicative of past data and a partial recompute?

   - Maybe this doesn't need to be special cased. Operators can deal with this when receiving data for version they already have

4. Attaching new views to a stream with existing views seems to cause a recompute of the old views...
   Found in repliear kanban
   --> Issue is that `notifyCommitted` does not respect path pruning.

# Observability

- Add OTEL hooks
- Add counters
  - Destruction
  - Graph size
- Add ability to export and visualize the graph

---

Cut the API space.

rematerialization is problematic. Creates these partial recomputation events rather than full.

So how do?

Clone & diff based pipeline rematerialization?

```ts
const view = tasks.after().take().materialize();

view.rematerializeFrom(tasks.after().take());

// ^^ -- update args of pipeline... well.. after is still
// not the same after. we have a partial compute still.
```

---

TODO:

1. Test lazyness (lazy.test.ts)
2. Implement partial "full recompute" to allow for re-materialization
   1. Also allows for pulling in data once something goes missing from a window due to delete
3. Start porting to Strut.io?
4. Clean / prune the APIs?

How might we implement pulling? Such that once limit is hit, upstreams stop computing.

Simple virtual scroll solution:

1. Pull all the data into a treap
2. Re-materialize into treap as we scroll
3. Pull a bunch of windows that we maintain in pages
   -- NO: Has a delete and shuffling problem!
4. Pull the last (2) windows
   -- Only shuffling between 2 windows
   -- How do we map the virtual index correctly?
   -- we just need to understand where these pages come in WRT to the overall virtual indices.
   -- but what about when sizes change? Same same. `PULL NEXT PAGE AFTER _cursor_ MAP TO _virtual-index_`
   -- ^^ doable but... lots of new mechanics to introduce.

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
