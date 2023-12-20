
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

CREATE INDEX IF NOT EXISTS "issue_kanbanorder_idx" ON "issue" ("kanbanorder");

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

CREATE TABLE IF NOT EXISTS "filter_state" (
  "id" '"singleton"' PRIMARY KEY NOT NULL,
  "orderBy" '"title" | "creator" | "priority" | "status" | "created" | "modified"' DEFAULT 'created' NOT NULL,
  "orderDirection" '"asc" | "desc"' DEFAULT 'asc' NOT NULL,
  "status" 'String_of<StatusType[]>',
  "priority" 'String_of<PriorityType[]>',
  "query" TEXT
);
