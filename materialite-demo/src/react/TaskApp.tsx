import React, { useState } from "react";
import { TaskTable } from "./TaskTable";
import { TaskComponent } from "./Task";
import { Task } from "../data/tasks/schema";
import { createTasks } from "../data/tasks/createTasks";
import { TaskFilter } from "./TaskFilter";

const seedTasks = createTasks(1000);
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<[number, Task] | null>(null);
  const [allTasks, setAllTasks] = useState(seedTasks);
  const [filteredTasks, setFilteredTasks] = useState(allTasks);

  const onTaskSelected = (task: Task, idx: number) => {
    setSelectedTask([idx, task]);
  };

  function refilterTasks(filter: TaskFilter) {
    setFilteredTasks(filterTasks(filter, allTasks));
  }

  return (
    <div className="flex h-screen">
      {/* Left Pane - Task Table */}
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={refilterTasks} />
        <TaskTable
          tasks={filteredTasks}
          onTaskClick={onTaskSelected}
          selectedTask={selectedTask != null ? selectedTask[1].id : undefined}
        />
      </div>
      {/* Right Pane - Task Details */}
      <div className="w-1/4 bg-white overflow-y-auto p-6">
        {selectedTask ? (
          <TaskComponent task={selectedTask[1]} />
        ) : (
          <div>Select a task to view details</div>
        )}
      </div>
    </div>
  );
};

function filterTasks(filter: TaskFilter, tasks: Task[]): Task[] {
  return tasks.filter((task) => {
    let keep = true;
    for (const k in filter) {
      const casted = k as keyof TaskFilter;
      if (filter[casted] == null) {
        continue;
      }
      keep = task[casted] === filter[casted];
      if (!keep) {
        return false;
      }
    }

    return keep;
  });
}
