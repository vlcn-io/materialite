import React, { useEffect, useMemo, useState } from "react";
import { TaskTable } from "./TaskTable.js";
import { TaskComponent } from "./Task.js";
import { Task } from "../data/tasks/schema.js";
import { createTasks } from "../data/tasks/createTasks.js";
import { TaskFilter } from "./TaskFilter.js";
import { Materialite } from "@vlcn.io/materialite";

const seedTasks = createTasks(10000);

const materialite = new Materialite();
const allTasks = materialite.newSet<Task>();

export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskFilter>({});

  function onTaskSelected(task: Task) {
    // TODO: just update the task itself..
    // get join working later.
    const oldTask = task;
    task = { ...task, selected: true };
    setSelectedTask(task);
    onTaskUpdated(oldTask, task);
  }

  function onTaskUpdated(oldTask: Task, newTask: Task) {
    materialite.tx(() => {
      allTasks.delete(oldTask);
      allTasks.add(newTask);
    });
  }

  const filteredTasks = useMemo(() => {
    return allTasks.stream.filter((task) => {
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
  }, [filter]);

  const ret = (
    <div className="flex h-screen">
      {/* Left Pane - Task Table */}
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={setFilter} />
        <TaskTable tasks={filteredTasks} onTaskClick={onTaskSelected} />
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

  useEffect(() => {
    allTasks.addAll(seedTasks);
  }, []);

  return ret;
};
