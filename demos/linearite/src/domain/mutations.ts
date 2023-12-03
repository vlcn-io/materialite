import { TXAsync } from "@vlcn.io/xplat-api"
import { Issue, Description, Comment, StatusType } from "./SchemaType"
import { ID_of } from "@vlcn.io/id"

function colNames(obj: { [key: string]: unknown }) {
  return Object.keys(obj).map(key => `"${key}"`).join(', ');
}

function placeholders(obj: { [key: string]: unknown }) {
  return Object.keys(obj).map(() => '?').join(', ');
}

function values(obj: { [key: string]: unknown }) {
  return Object.values(obj);
}

function set(obj: { [key: string]: unknown }) {
  return Object.keys(obj).map(key => `"${key}" = ?`).join(', ');
}

// TODO: prepare mutation statements
// TODO: tables used cache for writes
export const mutations = {
  createIssue(tx: TXAsync, issue: Issue) {
    return tx.exec(
      `INSERT INTO issue (${colNames(issue)}) VALUES (${placeholders(issue)})`,
      values(issue)
    );
  },

  createDescription(tx: TXAsync, desc: Description) {
    return tx.exec(
      `INSERT INTO description (${colNames(desc)}) VALUES (${placeholders(desc)})`,
      values(desc)
    );
  },

  createIssueWithDescription(tx: TXAsync, issue: Issue, desc: Description) {
    return tx.exec(
      `INSERT INTO issue (${colNames(issue)}) VALUES (${placeholders(issue)})`,
      values(issue)
    ).then(() => {
      return tx.exec(
        `INSERT INTO description (${colNames(desc)}) VALUES (${placeholders(desc)})`,
        values(desc)
      );
    });
  },

  createComment(tx: TXAsync, comment: Comment) {
    return tx.exec(
      `INSERT INTO comment (${colNames(comment)}) VALUES (${placeholders(comment)})`,
      values(comment)
    );
  },

  updateIssue(tx: TXAsync, issue: Partial<Issue>) {
    if (!issue.modified) {
      issue = {
        ...issue,
        modified: Date.now()
      }
    }
    return tx.exec(
      `UPDATE issue SET ${set(issue)} WHERE id = ?`,
      [...values(issue), issue.id]
    );
  },

  updateDescription(tx: TXAsync, desc: Description) {
    return tx.exec(
      `UPDATE description SET ${set(desc)} WHERE id = ?`,
      [...values(desc), desc.id]
    );
  },

  moveIssue(tx: TXAsync, id: ID_of<Issue>, afterId: ID_of<Issue> | null, newStatus: StatusType) {
    return tx.exec(
      `UPDATE issue_fractindex SET after_id = ?, status = ? WHERE id = ?`,
      [afterId, newStatus, id]
    )
  },

  async deleteIssue(tx: TXAsync, id: ID_of<Issue>) {
    await tx.exec(
      `DELETE FROM issue WHERE id = ?`,
      [id]
    );
    await tx.exec(
      `DELETE FROM description WHERE id = ?`,
      [id]
    );
    await tx.exec(
      `DELETE FROM comment WHERE issueId = ?`,
      [id]
    );
  }
};
