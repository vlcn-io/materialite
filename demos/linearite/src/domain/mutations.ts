import { Issue, Description, Comment, FilterState } from "./SchemaType";
import { db } from "./db";

// TODO: prepare mutation statements
// TODO: tables used cache for writes
export const mutations = {
  putIssue(issue: Issue) {
    db.tx(() => {
      const existing = db.issues.base.value.get(issue.id);
      if (existing) {
        db.issues.delete(existing);
      }

      db.issues.add({
        ...issue,
        modified: Date.now(),
      });
    });
  },

  putDescription(desc: Description) {
    db.descriptions.add(desc);
  },

  putIssueWithDescription(issue: Issue, desc: Description) {
    db.tx(() => {
      db.issues.add(issue);
      db.descriptions.add(desc);
    });
  },

  putComment(comment: Comment) {
    db.comments.add(comment);
  },

  putFilterState(state: FilterState) {
    db.appState.add(state);
  },

  moveIssue() {},

  deleteIssue(issue: Issue) {
    db.tx(() => {
      db.issues.delete(issue);
      db.descriptions.delete({
        id: issue.id,
        body: "",
      });
      // TODO: we need a way to delete all comments for an issue
      // we can fetch all comments in a range since they're sorted by issue id.
    });
  },
};
