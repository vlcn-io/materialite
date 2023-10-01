# materialite


# KV

Which key-value store to use?

- https://github.com/spacejam/sled
- Rocks?

# Reading

- https://github.com/frankmcsherry/blog/blob/master/posts/2016-07-17.md
- https://materialize.com/blog/differential-from-scratch/
- DBSP & Feldera paper(s)
- https://github.com/jamii/dida

# The Browser Problem

- Storage calls must be async
- Lack of threads in WASM?
- Want sync diffi flow and async persist? Can we spawn a thread for this? Does dataflow need to be in JS with wasm for persist?
