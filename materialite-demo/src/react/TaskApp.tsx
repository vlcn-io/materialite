import React, { useMemo, useState } from "react";
import { TaskTable } from "./TaskTable.js";
import { TaskComponent } from "./Task.js";
import { Task } from "../data/tasks/schema.js";
import { createTasks } from "../data/tasks/createTasks.js";
import { TaskFilter } from "./TaskFilter.js";

const seedTasks = createTasks(10000);
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState(seedTasks);
  const [filter, setFilter] = useState<TaskFilter>({});

  function onTaskSelected(task: Task) {
    setSelectedTask(task);
  }

  function onTaskUpdated(task: Task) {
    if (selectedTask == null) {
      return;
    }
    if (selectedTask.id !== task.id) {
      return;
    }
    // oof
    const allTasksCopy: Task[] = [];
    for (const t of allTasks) {
      if (t.id === task.id) {
        allTasksCopy.push(task);
      } else {
        allTasksCopy.push(t);
      }
    }
    setAllTasks(allTasksCopy);
    setSelectedTask(task);
  }

  const filteredTasks = useMemo(() => {
    return filterTasks(filter, allTasks);
  }, [allTasks, filter]);

  return (
    <div className="flex h-screen">
      {/* Left Pane - Task Table */}
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={setFilter} />
        <TaskTable
          tasks={filteredTasks}
          onTaskClick={onTaskSelected}
          selectedTask={selectedTask != null ? selectedTask.id : undefined}
        />
      </div>
      {/* Right Pane - Task Details */}
      <div className="w-1/4 bg-white overflow-y-auto p-6">
        {selectedTask ? (
          <TaskComponent task={selectedTask} onTaskChanged={onTaskUpdated} />
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
