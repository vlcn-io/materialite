import {
  AppState,
  Comment,
  Description,
  ID_of,
  Issue,
  Order,
} from "./SchemaType";
import { Materialite, MutableSetSource } from "@vlcn.io/materialite";
import { createIssues } from "./seed";

const m = new Materialite();

function tieBreak(comp: (l: Issue, r: Issue) => number) {
  return (l: Issue, r: Issue) => {
    let c = comp(l, r);
    if (c !== 0) return c;
    return l.id - r.id;
  };
}

const issueComparators: Record<Order, (l: Issue, r: Issue) => number> = {
  id: (l, r) => l.id - r.id,
  title: tieBreak((l, r) => l.title.localeCompare(r.title)),
  creator: tieBreak((l, r) => l.creator.localeCompare(r.creator)),
  priority: tieBreak((l, r) => l.priority.localeCompare(r.priority)),
  status: tieBreak((l, r) => l.status.localeCompare(r.status)),
  created: tieBreak((l, r) => l.created - r.created),
  modified: tieBreak((l, r) => l.modified - r.modified),
  kanbanorder: tieBreak((l, r) => l.kanbanorder.localeCompare(r.kanbanorder)),
};

const appStateComparator = (l: AppState, r: AppState) => {
  return l._tag.localeCompare(r._tag);
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

/**
 * Maintains base collection and indices for issues
 */
class IssueCollection {
  readonly #orderedIndices = new Map<Order, MutableSetSource<Issue>>();
  readonly #base = m.newUnorderedSet<number, Issue>((issue: Issue) => issue.id);

  add(issue: Issue) {
    this.#base.add(issue);
    for (const index of this.#orderedIndices.values()) {
      index.add(issue);
    }
  }

  delete(issue: Issue) {
    this.#base.delete(issue);
    for (const index of this.#orderedIndices.values()) {
      index.delete(issue);
    }
  }

  get(id: ID_of<Issue>): Issue | undefined {
    return this.#base.value.get(id);
  }

  // We omit `add` and `delete` on the returned type since
  // the developer should mutate `issueCollection` which keeps all the indices in sync.
  getSortedSource(
    order: Order
  ): Omit<MutableSetSource<Issue>, "add" | "delete"> {
    let index = this.#orderedIndices.get(order);
    if (!index) {
      index = m.newSortedSet<Issue>(issueComparators[order]);
      const newIndex = index;
      m.tx(() => {
        for (const issue of this.#base.value.values()) {
          newIndex.add(issue);
        }
      });
      this.#orderedIndices.set(order, index);
    }
    return index;
  }
}

// TODO: support a reverse view of a source for `asc` vs `desc` order
export const db = {
  issues: new IssueCollection(),
  appState: m.newSortedSet(appStateComparator),
  comments: m.newSortedSet(commentComparator),
  descriptions: m.newSortedSet(descriptionComparator),
  tx: m.tx.bind(m),
} as const;

export type DB = typeof db;

function fillWithSampleData() {
  m.tx(() => {
    for (const [issue, desc] of createIssues(1_000_000)) {
      db.issues.add(issue);
      db.descriptions.add(desc);
    }
  });
}

fillWithSampleData();
