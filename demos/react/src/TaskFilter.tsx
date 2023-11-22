import React from "react";
import { Task } from "./data/schema.js";

import { names, priorities, statuses, projects } from "./data/createTasks.js";
import { Filter, appStateComparator, db } from "./data/DB.js";
import { useQuery } from "@vlcn.io/materialite-react";

export const TaskFilter: React.FC = () => {
  const [, filters] = useQuery(
    () =>
      db.appState.stream
        .filter((s): s is Filter => s._tag === "filter")
        .materialize(appStateComparator),
    []
  );

  const filtersObj = filters.reduce((acc, f) => {
    (acc[f.key] as any) = f.value;
    return acc;
  }, {} as Partial<Task>);

  function controlChange(key: keyof Task, value?: string) {
    if (value != null) {
      db.appState.add({ _tag: "filter", key, value });
    } else {
      db.appState.delete({ _tag: "filter", key } as any); // TODO: deletion by partial object.... hmm, based on comparator args really.
    }
  }

  function makeOption(v: string) {
    return (
      <option value={v} key={v}>
        {v}
      </option>
    );
  }

  return (
    <div
      className="fixed top-0 left-0 w-3/4 bg-white p-4 z-10"
      style={{ boxShadow: "0 2px 2px -2px rgb(0 0 0 / 0.1)" }}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Assignee Filter */}
        <div>
          <label className="m-2 inline-block w-24">Assignee</label>
          <select
            className="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64"
            value={filtersObj.assignee || ""}
            onChange={(e) => {
              controlChange("assignee", e.target.value || undefined);
            }}
          >
            <option value="">Any</option>
            {names.map(makeOption)}
          </select>
        </div>
        <div>
          <label className="m-2 inline-block w-24">Priority</label>
          <select
            className="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64"
            value={filtersObj.priority || ""}
            onChange={(e) => {
              controlChange("priority", e.target.value || undefined);
            }}
          >
            <option value="">Any</option>
            {priorities.map(makeOption)}
          </select>
        </div>
        <div>
          <label className="m-2 inline-block w-24">Project</label>
          <select
            className="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64"
            value={filtersObj.project || ""}
            onChange={(e) => {
              controlChange("project", e.target.value || undefined);
            }}
          >
            <option value="">Any</option>
            {projects.map(makeOption)}
          </select>
        </div>
        <div>
          <label className="m-2 inline-block w-24">Status</label>
          <select
            className="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64"
            value={filtersObj.status || ""}
            onChange={(e) => {
              controlChange("status", e.target.value || undefined);
            }}
          >
            <option value="">Any</option>
            {statuses.map(makeOption)}
          </select>
        </div>
      </div>
    </div>
  );
};
