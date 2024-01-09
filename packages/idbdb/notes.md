IDB is super fast if we store pages of data in it: https://observablehq.com/@tantaman/indexeddb-timings

We can use IDB as our key-value store to back our database.

1. Pages are simply sections of a treap.
2. Treaps are X size
3. Treaps split when over X size
4. Treap is keyed by lower key
5. Read-in data is put into a single treap cache in client
6. Written data is put in a treap wal
7. Treap wal is checked before cache on read
8. treap wal lazily checkpointed to persistent treap running on worker

we don't need a full blown b-tree in idb. We just cache all keys in-memory in a binary tree.

- Say we have 1 million pages.
- If a page is 5,000 objects, that's 5 billion objects total.
- 1 million pages is 1 million keys. 1 million uuids is 16mb. That's fine. That's simple.

-> Snapshotting to persistent worker? Transfer overhead high?
..-> Transferrable objects?
-> Rebasing of local writes that are not snapshotted yet?
