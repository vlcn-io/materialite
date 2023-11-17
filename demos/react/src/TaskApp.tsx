import React, { useState } from "react";
import { TaskComponent } from "./Task.js";
import { Task } from "./data/tasks/schema.js";
import { createTasks } from "./data/tasks/createTasks.js";
import { Materialite } from "@vlcn.io/materialite";
import { Filter, TaskFilter } from "./TaskFilter.js";
import { useNewView } from "@vlcn.io/materialite-react";
import TaskTable3 from "./TaskTable3.js";

const materialite = new Materialite();
const taskComparator = (l: Task, r: Task) => l.id - r.id;
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>({});

  const [allTasks, setAllTasks] = useState(() => {
    const ret = materialite.newSortedSet(taskComparator);
    materialite.tx(() => {
      for (const t of createTasks(100)) {
        ret.add(t);
      }
    });
    return ret;
  });

  function onTaskSelected(task: Task) {
    setSelectedTask(task);
  }

  function onTaskUpdated(oldTask: Task, newTask: Task) {
    setSelectedTask(newTask);
    materialite.tx(() => {
      allTasks.delete(oldTask);
      allTasks.add(newTask);
    });
  }

  // AFTER and LIMIT and materialized JS Array
  const [, filteredTasks] = useNewView(() => {
    return allTasks.stream
      .filter((t) => !t.title.includes("foo"))
      .materialize(taskComparator);
  }, [allTasks]);

  /*
  tasks={filteredTasks}
          onTaskClick={onTaskSelected}
          selectedTask={selectedTask != null ? selectedTask.id : undefined}
  */
  return (
    <div className="flex h-screen">
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={setFilter} />
        <TaskTable3 />
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
};
