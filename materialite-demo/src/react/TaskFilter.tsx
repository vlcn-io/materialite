import React, { useState } from "react";
import { Priority, Status } from "../data/tasks/schema";

import {
  names,
  priorities,
  statuses,
  projects,
} from "../data/tasks/createTasks";

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
    return <option value={v}>{v}</option>;
  }

  return (
    <div
      className="fixed top-0 left-0 w-3/4 bg-white p-4 z-10"
      style={{ boxShadow: "0 2px 2px -2px rgb(0 0 0 / 0.1)" }}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Assignee Filter */}
        <select
          value={filter.assignee || ""}
          onChange={(e) => {
            controlChange("assignee", e.target.value || undefined);
          }}
        >
          <option value="">Any Assignee</option>
          {names.map(makeOption)}
        </select>
        <select
          value={filter.priority || ""}
          onChange={(e) => {
            controlChange("priority", e.target.value || undefined);
          }}
        >
          <option value="">Any Priority</option>
          {priorities.map(makeOption)}
        </select>
      </div>
    </div>
  );
};
