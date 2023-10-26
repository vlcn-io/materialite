# materialite

## Install & Build

```sh
pnpm install
cd buildall
pnpm watch
```

## Test

Prerequisite: `pnpm install`

```sh
pnpm test
```

## React Demo

installed & built.

```sh
cd demos/react
pnpm dev
```

## API

Three concepts:

1. Source collection
2. Difference Stream
3. Sink collection

- The source collection is your collection of values that you modify by adding and removing items.
- The difference stream is the set of operations you want to apply against the source collection. E.g., `map`, `filter`, `reduce`, `join`, etc.
- The sink materializes the result of your operations into a new collection such that you can interact with it via normal collection methods.

Sinks are always sorted such that we can find the row to be updated after some different has been written to the source.

```ts
const materialite = new Materialite(keyFn);
const source = materialite.newMutableMap(); // or StatelessSetSource or PersistentSetSource
const derived = source.stream.map(() => ...).filter(() => ...).join(otherStream, keyFn, keyFn2).reduce(() => ...);
const view = derived.materialize(comparator)
view.onChange((data) => {
  ...
  // do stuff with the view
  // changes to the view include the full materialize view
  // if you want to listen just to diffs, listen to the stream directly
});

set.add(...);
set.delete(...);

materialite.tx(() => {
  // do many set/delete operations in a single tx
  // no pipelines will run until the tx commits
})
```

Each operation applied to `stream` will only operate on the diff of the dataset rather than the entire dataset each time the dataset is changed.

# TODO:

- [ ] React strict mode. Need to re-pull on re-connect of sink to source given strict mode runs effects twice.
- [ ] Allow source to be written before sink is connected. Maybe this already works? untested.
- [ ] Comparator for difference stream so equality can be key based?
- [ ] Better performing tree other than red-black tree?


----

pipeline setup?

