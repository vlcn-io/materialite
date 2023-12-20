import { Comment, Description, Issue } from "./SchemaType";
import { Materialite } from "@vlcn.io/materialite";
import { createIssues } from "./seed";
export type AppState = Filter | Selected;

const m = new Materialite();
const issueComparator = (l: Issue, r: Issue) => {
  let comp = l.modified - r.modified;
  if (comp !== 0) return comp;
  return l.id - r.id;
};
const appStateComparator = (l: AppState, r: AppState) => {
  let comp = l._tag.localeCompare(r._tag);
  if (comp !== 0) return comp;

  switch (l._tag) {
    case "filter":
      // filters with the same key are removed and replaced with the new one
      // hence no comparison on value -- TODO: change that.
      return l.key.localeCompare((r as Filter).key);
    case "selected":
      // we allow for many selected items, hence compare on id
      return l.id - (r as Selected).id;
  }
};
const commentComparator = (l: Comment, r: Comment) => {
  let comp = l.issueId - r.issueId;
  if (comp !== 0) return comp;
  comp = l.created - r.created;
  if (comp !== 0) return comp;
  return l.id - r.id;
};
const descriptionComparator = (l: Description, r: Description) => {
  return l.id - r.id;
};

export type Filter = {
  _tag: "filter";
  key: keyof Issue;
  value: string;
};
export type Selected = {
  _tag: "selected";
  id: number;
};

export const db = {
  issues: m.newSortedSet(issueComparator),
  appState: m.newSortedSet(appStateComparator),
  comments: m.newSortedSet(commentComparator),
  descriptions: m.newSortedSet(descriptionComparator),
  tx: m.tx.bind(m),
};

function fillWithSampleData() {
  m.tx(() => {
    for (const [issue, desc] of createIssues(1_000_000)) {
      db.issues.add(issue);
      db.descriptions.add(desc);
    }
  });
}

fillWithSampleData();
