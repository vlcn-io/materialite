import { ID_of } from '@vlcn.io/id'

export type Issue = SchemaType['issue']
export type Description = SchemaType['description']
export type Comment = SchemaType['comment']

namespace Symbols {
  export declare const brand: unique symbol
}

export type StatusType = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'
export type PriorityType = 'none' | 'urgent' | 'high' | 'low' | 'medium'

export type String_of<T> = string & { readonly [Symbols.brand]: T }

// === custom code above this line ===
export type SchemaType = {
  readonly issue: Readonly<{
    id: ID_of<Issue>;
    title: string;
    creator: string;
    priority: "none" | "urgent" | "high" | "low" | "medium";
    status: "backlog" | "todo" | "in_progress" | "done" | "canceled";
    created: number;
    modified: number;
    kanbanorder: any | null
  }>;
  readonly description: Readonly<{
    id: ID_of<Issue>;
    body: string
  }>;
  readonly comment: Readonly<{
    id: ID_of<Comment>;
    body: string;
    creator: string;
    issueId: ID_of<Issue> | null;
    created: number
  }>
};