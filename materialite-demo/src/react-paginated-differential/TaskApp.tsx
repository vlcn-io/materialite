import React, { useEffect, useMemo, useState } from "react";
import { TaskTable } from "./TaskTable.js";
import { TaskComponent } from "./Task.js";
import { Task } from "../data/tasks/schema.js";
import { createTasks } from "../data/tasks/createTasks.js";
import { TaskFilter } from "./TaskFilter.js";
import { Materialite } from "@vlcn.io/materialite";

const seedTasks = createTasks(1000000);
const materialite = new Materialite();
const tasks = materialite.newSet<Task>();
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskFilter>({});

  function onTaskSelected(task: Task) {
    setSelectedTask(task);
  }

  function onTaskUpdated(oldTask: Task, newTask: Task) {
    setSelectedTask(newTask);
    materialite.tx(() => {
      tasks.delete(oldTask);
      tasks.add(newTask);
    });
  }

  const filteredTasks = useMemo(() => {
    return tasks.stream.filter((task) => {
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

  useEffect(() => {
    tasks.addAll(seedTasks);
  }, []);

  return ret;
};
