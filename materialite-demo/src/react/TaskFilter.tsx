import React, { useState } from "react";
import { Priority, Status } from "../data/tasks/schema.js";

import {
  names,
  priorities,
  statuses,
  projects,
} from "../data/tasks/createTasks.js";

type TaskFilterProps = {
  onFilterChange: (filter: TaskFilter) => void;
};

export type TaskFilter = {
  assignee?: string;
  priority?: Priority;
  status?: Status;
  project?: string;
};

export const TaskFilter: React.FC<TaskFilterProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState<TaskFilter>({});

  function controlChange(key: keyof TaskFilter, value?: string) {
    setFilter((prev) => ({ ...prev, [key]: value }));
    onFilterChange({
      ...filter,
      [key]: value || undefined,
    });
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
            value={filter.assignee || ""}
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
            value={filter.priority || ""}
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
            value={filter.project || ""}
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
            value={filter.status || ""}
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
