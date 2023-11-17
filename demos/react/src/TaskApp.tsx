import React, { useState } from "react";
import { TaskComponent } from "./Task.js";
import { Task } from "./data/tasks/schema.js";
import { createTasks } from "./data/tasks/createTasks.js";
import { DifferenceStream, Materialite } from "@vlcn.io/materialite";
import { Filter, TaskFilter } from "./TaskFilter.js";
import { TaskTable2 } from "./TaskTable2.js";

const materialite = new Materialite();
export const taskComparator = (l: Task, r: Task) => l.id - r.id;
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>({});

  const [allTasks, setAllTasks] = useState(() => {
    const ret = materialite.newSortedSet(taskComparator);
    materialite.tx(() => {
      // 1_000_000
      for (const t of createTasks(4_000_000)) {
        ret.add(t);
      }
    });
    return ret;
  });

  // filter, after, etc.
  const [taskStream, setTaskStream] = useState<DifferenceStream<Task>>(
    allTasks.stream
  );

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

  /*
  tasks={filteredTasks}
          onTaskClick={onTaskSelected}
          selectedTask={selectedTask != null ? selectedTask.id : undefined}
  */
  return (
    <div className="flex h-screen">
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={setFilter} />
        <TaskTable2 tasks={taskStream} onTaskClick={onTaskSelected} />
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
