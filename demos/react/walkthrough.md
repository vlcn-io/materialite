# Materialite Demo App Walkthrough

Think of Materialite as a database. A database that can efficiently respond to changes in data.

Think of the react demo application as an app where all state is stored in the database. Rather than ever using `useState` and `setState` we read and write state to/from the database.

> ⚠️ Note that we're still figuring out the best APIs to expose to developers and there are still bugs in Materialite.

## The Demo App

The demo app is a simple task tracking app. There's:

1. A table of tasks
2. A detail task view
3. A task filter

The state of each of these components is stored in the DB. Each of these components also subscribes to the DB so it can re-render itself when the data it is using from the DB changes. The demo is seeded with 1 million tasks.

[materialite-react-demo.webm](https://github.com/vlcn-io/materialite/assets/1009003/22798248-2930-4f84-bfc9-a066f6eb7481)

## main.tsx

`main.tsx` is the component used to mount into the DOM. All it does is mount and render `TaskApp` into a DOM element.

```ts
ReactDOM.createRoot(document.getElementById("root")!).render(<TaskApp />);
```

## DB.ts

> Think of the react demo application as an app where all state is stored in the database.

`DB.ts` is the core entrypoint to our database and where all state is read and written. Here we set up three collections or tables:

1. tasks
2. comments
3. appState

as well as a convenience function to start a new transaction.

```ts
export const db = {
  tasks: m.newSortedSet(taskComparator),
  comments: m.newSortedSet(commentComparator),
  appState: m.newSortedSet(appStateComparator),
  tx: m.tx.bind(m),
};
```

Each collection requires a comparator so that:

1. We can access the backing data in sorted order, making things like pagination and comment lookup fast.
2. Replace duplicate items

`tasks` and `comments` are pretty obvious collections, `appState` less so. `appState` represents things like selected task, selected filters or other "ui level state" that you'd generally stick into `useState`. Making it managed by the DB and transactionally committed with other data has benefits discussed [here](https://riffle.systems/essays/prelude/).

Enforcing things like uniqueness constraints can be done via the comparator provided to the collection. E.g., we only allow one `filter` row for a given key.

```ts
export const appStateComparator = (l: AppState, r: AppState) => {
  let comp = l._tag.localeCompare(r._tag);
  if (comp !== 0) return comp;

  switch (l._tag) {
    case "filter":
      // filters with the same key are removed and replaced with the new one
      // hence no comparison on value
      return l.key.localeCompare((r as Filter).key);
    case "selected":
      // we allow for many selected items, hence compare on id
      return l.id - (r as Selected).id;
  }
};
```

## TaskApp.tsx

`TaskApp.tsx` is the root of our application. It:

1. Renders the child components: `TaskFilter`, `TaskTable`, and `TaskComponent`
2. Reads and writes task selection state

### Reading Selection State

Task selection state is queried directly from our DB via a `useQuery` hook made to integrate Materialite with React.

```ts
export default function TaskApp() {
  const [, selectedTask] = useQuery(
    () =>
      db.appState.stream
        .filter((s): s is Selected => s._tag === "selected")
        .materializeValue(null),
    []
  );
  // ...
```

Any time task selection state changes `useQuery` will return a new `selectedTask` value and re-render the component.

Note that `AppState` is actually a union type:

```ts
export type Filter = {
  _tag: "filter";
  key: keyof Task;
  value: string;
};
export type Selected = {
  _tag: "selected";
  id: number;
};

export type AppState = Filter | Selected;
```

but our query only cares about the `Selected` type. Since `materialite` is in JS we get the nice feature of type narrowing when querying it.

```ts
.filter((s): s is Selected => s._tag === "selected")
```

### Writing Selection State

`TaskApp.tsx` has an `onTaskSelected` handler. Here we:

1. Remove the currently selected task (if there is one)
2. Write the newly selected task

And this is done through normal set operations of `delete` and `add`.

```ts
// ...
function onTaskSelected(task: Task) {
  db.tx(() => {
    if (selectedTask) {
      db.appStates.delete({ _tag: "selected", id: selectedTask.id });
    }

    db.appStates.add({ _tag: "selected", id: task.id });
  });
}
// ...
```

### Sub-Components

`TaskApp.tsx` then renders the sub-components that make up the app:

1. TaskFilter
2. TaskTable
3. TaskComponent

`TaskTable` and `TaskFilter` both require access to the same state: what the current filter set is. Note, however, that we don't have to pass this state around.
