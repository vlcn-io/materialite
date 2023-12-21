export type Issue = SchemaType["issue"];
export type Description = SchemaType["description"];
export type Comment = SchemaType["comment"];

namespace Symbols {
  export declare const brand: unique symbol;
}

export type Order = keyof Issue;
export type AppState = FilterState | SelectionState;
export type FilterState = {
  _tag: "filter";
  orderBy: Order;
  orderDirection: "asc" | "desc";
  status: StatusType[] | null;
  priority: PriorityType[] | null;
  query: string | null;
};
export const defaultFilterState: FilterState = {
  _tag: "filter",
  orderBy: "modified",
  orderDirection: "desc",
  status: null,
  priority: null,
  query: null,
};

export type SelectionState = {
  _tag: "selected";
  id: number;
};

export type StatusType =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "canceled";
export type PriorityType = "none" | "urgent" | "high" | "low" | "medium";
export type ID_of<T> = number & { readonly [Symbols.brand]: T };

export type SchemaType = {
  readonly issue: Readonly<{
    id: ID_of<Issue>;
    title: string;
    creator: string;
    priority: PriorityType;
    status: StatusType;
    created: number;
    modified: number;
    kanbanorder: string;
  }>;
  readonly description: Readonly<{
    id: ID_of<Issue>;
    body: string;
  }>;
  readonly comment: Readonly<{
    id: ID_of<Comment>;
    body: string;
    creator: string;
    issueId: ID_of<Issue>;
    created: number;
  }>;
};
