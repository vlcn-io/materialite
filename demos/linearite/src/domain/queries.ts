import { Query } from "@vlcn.io/react";
import { filterStateToOrder, filterStateToWhere } from "../utils/filterState";
import { Schema as S } from "./Schema";
import {
  DecodedFilterState,
  Issue,
  PriorityType,
  StatusType,
  String_of,
} from "./SchemaType";
import { ID_of } from "@vlcn.io/id";

export const queries = {
  // Types are auto-generated via `typed-sql`
  // run `pnpm sql-watch` to generate types
  totalIssueCount: S.sql<{
    c: number;
  }>`SELECT COUNT(*) AS c FROM issue`,

  filteredIssueCount: (filters: DecodedFilterState) =>
    `SELECT count(*) as c FROM issue ${filterStateToWhere(filters)}` as Query<{
      c: number;
    }>,

  boardIssues: (filters: DecodedFilterState) => {
    // TODO: page after cursor
    return `SELECT * FROM issue ${filterStateToWhere(
      filters
    )} ORDER BY kanbanorder ASC` as Query<Issue>;
  },

  listIssues: (filters: DecodedFilterState) => {
    return `SELECT * FROM
      issue
      ${filterStateToWhere(filters)}
      ${filterStateToOrder(filters)}
      LIMIT ?,?` as Query<Issue>;
  },

  issue: S.sql<{
    id: ID_of<Issue>;
    title: string;
    creator: string;
    priority: "none" | "urgent" | "high" | "low" | "medium";
    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
    created: number;
    modified: number;
    kanbanorder: any | null;
  }>`SELECT * FROM issue WHERE id = ?`,

  filterState: S.sql<{
    id: "singleton";
    orderBy:
      | "title"
      | "creator"
      | "priority"
      | "status"
      | "created"
      | "modified";
    orderDirection: "asc" | "desc";
    status: String_of<StatusType[]> | null;
    priority: String_of<PriorityType[]> | null;
    query: string | null;
  }>`SELECT * FROM filter_state`,

  issueDescription: S.sql<{
    id: ID_of<Issue>;
    body: string;
  }>`SELECT * FROM description WHERE id = ?`,

  issueComments: S.sql<{
    id: ID_of<Comment>;
    body: string;
    creator: string;
    issueId: ID_of<Issue> | null;
    created: number;
  }>`SELECT * FROM comment WHERE issueId = ?`,
};
