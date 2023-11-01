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