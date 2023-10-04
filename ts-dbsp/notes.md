Starting from: https://materialize.com/blog/differential-from-scratch/

And: https://arxiv.org/abs/2203.16684

The key idea / main thrust here is that we can build a handful of highly complex incremental views from event-sourced data.

Once we have these complex views, we can do simple queries against them for which reactive subscriptions are trivial to create.

# Demos

- Demo against Signia?
- React / DOM diffing?
- Arbitrary logic and runtime? Immutable JS stuff? React state updates? Redux?