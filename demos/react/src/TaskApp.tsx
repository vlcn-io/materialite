import React, { useEffect, useMemo, useState } from "react";
import { TaskTable2 } from "./TaskTable2.js";
import { TaskComponent } from "./Task.js";
import { Task } from "./data/tasks/schema.js";
import { createTasks } from "./data/tasks/createTasks.js";
import { Materialite } from "@vlcn.io/materialite";
import { Filter, TaskFilter } from "./TaskFilter.js";

const materialite = new Materialite();
const tasks = materialite.newStatelessSet<Task>();

export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>({});

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

  const filteredTasks = useMemo(
    () => tasks.stream.filter((t) => !t.title.includes("foo")),
    [tasks]
  );

  const ret = (
    <div className="flex h-screen">
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={setFilter} />
        <TaskTable2
          tasks={filteredTasks}
          onTaskClick={onTaskSelected}
          selectedTask={selectedTask != null ? selectedTask.id : undefined}
        />
      </div>
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
    //4_000_000
    tasks.addAll(createTasks(100));
  }, []);

  return ret;
};
