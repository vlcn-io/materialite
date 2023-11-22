import React from "react";
import { TaskComponent } from "./TaskComponent.js";
import { Task } from "./data/schema.js";
import { TaskFilter } from "./TaskFilter.js";
import { TaskTable2 } from "./TaskTable2.js";
import { Selected, db } from "./data/DB.js";
import { useNewView } from "@vlcn.io/materialite-react";

export const TaskApp: React.FC = () => {
  const allTasks = db.tasks;

  // TODO: re-order view vs value return
  const [, selectedTask] = useNewView(
    () =>
      db.appStates.stream
        .filter((s): s is Selected => s._tag === "selected")
        .materializeValue(null),
    []
  );

  function onTaskSelected(task: Task) {
    db.tx(() => {
      if (selectedTask) {
        db.appStates.delete({ _tag: "selected", id: selectedTask.id });
      }

      db.appStates.add({ _tag: "selected", id: task.id });
    });
  }

  function onTaskUpdated(oldTask: Task, newTask: Task) {
    db.tx(() => {
      allTasks.delete(oldTask);
      allTasks.add(newTask);
    });
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter />
        <TaskTable2
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
