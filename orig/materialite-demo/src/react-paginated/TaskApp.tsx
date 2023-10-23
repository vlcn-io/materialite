import React, { useMemo, useState } from "react";
import { TaskTable } from "./TaskTable.js";
import { TaskComponent } from "./Task.js";
import { Task } from "../data/tasks/schema.js";
import { createTasks } from "../data/tasks/createTasks.js";
import { OrderedMap } from "immutable";

const seedTasks = OrderedMap(createTasks(2000000).map((t) => [t.id, t]));
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState(seedTasks);

  function onTaskSelected(task: Task) {
    setSelectedTask(task);
  }

  function onTaskUpdated(task: Task) {
    setAllTasks(allTasks.set(task.id, task));
    setSelectedTask(task);
  }

  const filteredTasks = useMemo(() => {
    return filter((t: Task) => !t.title.includes("foo"), allTasks);
  }, [allTasks]);

  return (
    <div className="flex h-screen">
      {/* Left Pane - Task Table */}
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        {/* <TaskFilter onFilterChange={setFilter} /> */}
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

function filter<T>(fn: (t: T) => boolean, items: OrderedMap<number, T>): T[] {
  const ret = [];
  for (const t of items.values()) {
    if (fn(t)) {
      ret.push(t);
    }
  }

  return ret;
}
