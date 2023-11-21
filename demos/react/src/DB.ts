import { Materialite } from "@vlcn.io/materialite";
import { Comment, Task } from "./data/tasks/schema";

const m = new Materialite();
export const taskComparator = (l: Task, r: Task) => l.id - r.id;
export const commentComparator = (l: Comment, r: Comment) => l.id - r.id;

type Filter = {
  _tag: "filter";
  key: keyof Task;
  value: string;
};
type Selected = {
  _tag: "selected";
  id: number;
};

export type AppState = Filter | Selected;
export const appStateComparator = (l: AppState, r: AppState) => {
  let comp = l._tag.localeCompare(r._tag);
  if (comp !== 0) return comp;

  switch (l._tag) {
    case "filter":
      return (
        l.key.localeCompare((r as Filter).key) ||
        l.value.localeCompare((r as Filter).value)
      );
    case "selected":
      return l.id - (r as Selected).id;
  }
};

// Unsorted sources?
// And just do sorting as the final thing?
// That would preclude after based paging...
export const db = {
  task: m.newSortedSet(taskComparator),
  appState: m.newSortedSet(appStateComparator),
  comment: m.newSortedSet(commentComparator),
};
