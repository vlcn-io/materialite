import { SchemaType } from './SchemaType.js'
import { schema } from '@vlcn.io/typed-sql'
import { nanoid } from 'nanoid';
import {ID_of} from '@vlcn.io/id';

export const SchemaName = 'Schema.sql'
// DB name does not need to be static by any means. See other example apps and the vite-start for dynamic db names.
export const DBName = 'linear';
export function newID<T>(): ID_of<T> {
  return nanoid() as ID_of<T>;
}

export const Schema = schema<SchemaType>`
CREATE TABLE IF NOT EXISTS issue (
  "id" 'ID_of<Issue>' PRIMARY KEY NOT NULL,
  "title" TEXT DEFAULT '' NOT NULL,
  "creator" TEXT DEFAULT '' NOT NULL,
  "priority" '"none" | "urgent" | "high" | "low" | "medium"' DEFAULT 'none' NOT NULL,
  "status" '"backlog" | "todo" | "in_progress" | "done" | "canceled"' DEFAULT 'todo' NOT NULL,
  "created" INTEGER NOT NULL DEFAULT 0,
  "modified" INTEGER NOT NULL DEFAULT 0,
  "kanbanorder"
);

SELECT crsql_fract_as_ordered('issue', 'kanbanorder');
SELECT crsql_as_crr('issue');

CREATE TABLE IF NOT EXISTS "description" (
  "id" 'ID_of<Issue>' PRIMARY KEY NOT NULL,
  "body" TEXT DEFAULT '' NOT NULL
);
SELECT crsql_as_crr('description');

CREATE TABLE IF NOT EXISTS "comment" (
  "id" 'ID_of<Comment>' PRIMARY KEY NOT NULL,
  "body" TEXT DEFAULT '' NOT NULL,
  "creator" TEXT DEFAULT '' NOT NULL,
  "issueId" 'ID_of<Issue>',
  "created" INTEGER NOT NULL DEFAULT 0
);
SELECT crsql_as_crr('comment');
`
