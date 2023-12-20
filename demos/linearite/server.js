import express from "express";
import ViteExpress from "vite-express";
import { attachWebsocketServer } from "@vlcn.io/ws-server";
import * as http from "http";

import { createIssues } from "./createIssues.js";

const PORT = parseInt(process.env.PORT || "8080");

const app = express();
const server = http.createServer(app);

const wsConfig = {
  dbFolder: "./dbs",
  schemaFolder: "./src/domain",
  pathPattern: /\/sync/,
};

// Change this to return something we can listen to
// for when dbs are created and then use those DBs.
const dbCache = attachWebsocketServer(server, wsConfig);

// Set up our `linear` db on the backend
// We could have any number of DBs we want
// E.g., 1 per client, 1 per workspace, whatever.
// We currently just set up 1 single DB.
// The "room" set in the client identifies the DB used on the server.
// If the client sets the room to "linear" then it will connect to the
// "linear" DB on the server.
dbCache.use("linear", "Schema.sql", (wrapper) => {
  // getDB_unsafe is only unsafe under LiteFS deployments
  const db = wrapper.getDB();
  seedDB(db);
});

server.listen(PORT, () =>
  console.log("info", `listening on http://localhost:${PORT}!`)
);

ViteExpress.bind(app, server);

/**
 *
 * @param {import("better-sqlite3").Database} db
 * @returns
 */
async function seedDB(db) {
  const existing = db.prepare(`SELECT * FROM issue`).all();
  if (existing.length > 0) {
    console.log("db already seeded");
    return;
  }
  console.log("Seeding DB");

  const createIssueStmt = db.prepare(
    `INSERT INTO issue
      (id, title, creator, priority, status, created, modified, kanbanorder)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const createDescriptionStmt = db.prepare(
    `INSERT INTO description (id, body) VALUES (?, ?)`
  );
  db.transaction(() => {
    let i = 0;
    for (const [issue, description] of createIssues(7000)) {
      if (++i % 1000 === 0) {
        console.log("Seeded", i, "issues");
      }
      createIssueStmt.run(
        issue.id,
        issue.title,
        issue.creator,
        issue.priority,
        issue.status,
        issue.created,
        issue.modified,
        issue.kanbanorder
      );
      createDescriptionStmt.run(description.id, description.body);
    }
  })();

  console.log("Done seeding DB");
}
