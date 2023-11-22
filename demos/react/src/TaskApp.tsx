import React, { useState } from "react";
import { TaskComponent } from "./TaskComponent.js";
import { Task } from "./data/schema.js";
import { DifferenceStream, Materialite } from "@vlcn.io/materialite";
import { Filter, TaskFilter } from "./TaskFilter.js";
import { TaskTable2 } from "./TaskTable2.js";
import { Selected, db } from "./data/DB.js";
import { useNewView } from "@vlcn.io/materialite-react";

const materialite = new Materialite();
function applyFilters(filters: Filter, tasks: DifferenceStream<Task>) {
  let ret = tasks;
  for (const [key, value] of Object.entries(filters) as [
    keyof Filter,
    string
  ][]) {
    if (!value) continue;
    ret = ret.filter((task) => {
      return task[key] === value;
    });
  }
  return ret;
}

export const TaskApp: React.FC = () => {
  const [filter, setFilter] = useState<Filter>({});
  const allTasks = db.tasks;

  const [taskStream, setTaskStream] = useState<DifferenceStream<Task>>(() =>
    applyFilters(filter, allTasks.stream)
  );

  const [, selectedTask] = useNewView(
    () =>
      db.appStates.stream
        .filter((s) => s._tag === "selected") // TODO: allow filter to narrow the type
        .materializeValue(null),
    []
  );

  const updateFilter = (newFilter: Filter) => {
    allTasks.detachPipelines(); // TODO: This should already be handled by downstream components on un-mount. Test to ensure it is.
    setTaskStream(applyFilters(newFilter, allTasks.stream));
    setFilter(newFilter);
  };

  function onTaskSelected(task: Task) {
    db.appStates.add({ _tag: "selected", id: task.id });
  }

  function onTaskUpdated(oldTask: Task, newTask: Task) {
    materialite.tx(() => {
      allTasks.delete(oldTask);
      allTasks.add(newTask);
    });
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter onFilterChange={updateFilter} filter={filter} />
        <TaskTable2
          tasks={taskStream}
          onTaskClick={onTaskSelected}
          selectedTask={(selectedTask as Selected | null)?.id || null}
        />
      </div>
      <div className="w-1/4 bg-white overflow-y-auto p-6">
        {selectedTask ? (
          <TaskComponent
            taskId={(selectedTask as Selected).id}
            onTaskChanged={onTaskUpdated}
          />
        ) : (
          <div>Select a task to view details</div>
        )}
      </div>
    </div>
  );
};
