Prototype LSM tree DB.

Based around the thoughts here (from start of that channel in time): https://discord.com/channels/933657521581858818/1157258041318703114

We need synchronous reactivity. The browser does not provide this with things like SQLite where all commits are durable by default as the commit process requires an async call to storage.

WebApps also do not need immediately persisted commits in most cases.

We can do synchronous reactivity if we design an LSM tree specifically for the browser's I/O model.

- Tabs write to a mem tree in their UI thread
- This MemTree is shuttled to a PersistWorker when the tab does a durable write
- The persist worker writes to disk and merges with other trees
- The persist worker broadcasts merge results from 1 tab to others so they can reactively update if required
  - These merge result broadcasts respect transaction isolation
  - The persister orders events correctly such that synchronous reactivity doesn't conflict with broadcasts
    - Persistor should timestamp the broadcast then? Or not over-write current synchronous reactivity results as, since those are not persisted yet, they'll be persisted by persistor after the rx broadcast. Rebase local non-persisted state over rx broadcast after receiving rx broadcast?

Main features:
- Optional durability at write time
  - Future: write priority levels. Overtone. Geoffrey, Riffle

In [../notes.md](.../notes.md) there were thoughts on a purely event log approach with materialized views for simple rx.
> # derived from log views... -> simple rx above that as views are complex and queries are simple