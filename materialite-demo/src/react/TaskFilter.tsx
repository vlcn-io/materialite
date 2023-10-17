import React, { useState } from "react";
import { Priority, Status } from "../data/tasks/schema";

type TaskFilterProps = {
  onFilterChange: (filter: TaskFilter) => void;
};

export type TaskFilter = {
  assignee?: string;
  priority?: Status;
  status?: Priority;
  project?: string;
  dueDate?: Date;
};

export const TaskFilter: React.FC<TaskFilterProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState<TaskFilter>({});

  return (
    <div
      className="fixed top-0 left-0 w-3/4 bg-white p-4 z-10"
      style={{ boxShadow: "0 2px 2px -2px rgb(0 0 0 / 0.1)" }}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Assignee Filter */}
        <div>
          <select
            value={filter.assignee || ""}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, assignee: e.target.value }));
              onFilterChange({ ...filter, assignee: e.target.value });
            }}
          >
            <option value="">All Assignees</option>
            {/* Add all the assignee options here */}
          </select>
        </div>

        {/* ... Similar structure for Priority, Status, Project, and Due Date */}
      </div>
    </div>
  );
};
