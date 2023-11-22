import { Materialite } from "@vlcn.io/materialite";
import { Comment, Task } from "./schema";
import { createTasks } from "./createTasks";

const m = new Materialite();
export const taskComparator = (l: Task, r: Task) => l.id - r.id;
export const commentComparator = (l: Comment, r: Comment) => {
  let comp = l.taskId - r.taskId;
  if (comp !== 0) return comp;
  comp = l.created - r.created;
  if (comp !== 0) return comp;
  return l.id - r.id;
};

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

// Unsorted sources?
// And just do sorting as the final thing?
// That would preclude after based paging...
// So our DB needs extra indices. E.g., a comment by issue by date indice.
export const db = {
  tasks: m.newSortedSet(taskComparator),
  appStates: m.newSortedSet(appStateComparator),
  comments: m.newSortedSet(commentComparator),
  tx: m.tx.bind(m),
};

function fillWithSampleData() {
  m.tx(() => {
    for (const t of createTasks(1_000_000)) {
      db.tasks.add(t);
    }
  });
}

fillWithSampleData();
