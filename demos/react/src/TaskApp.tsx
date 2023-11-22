import { TaskComponent } from "./TaskComponent.js";
import { Task } from "./data/schema.js";
import { TaskFilter } from "./TaskFilter.js";
import { TaskTable } from "./TaskTable.js";
import { Selected, db } from "./data/DB.js";
import { useQuery } from "@vlcn.io/materialite-react";

export default function TaskApp() {
  const [, selectedTask] = useQuery(
    () =>
      db.appState.stream
        .filter((s): s is Selected => s._tag === "selected")
        .materializeValue(null),
    []
  );

  function onTaskSelected(task: Task) {
    db.tx(() => {
      if (selectedTask) {
        db.appState.delete({ _tag: "selected", id: selectedTask.id });
      }

      db.appState.add({ _tag: "selected", id: task.id });
    });
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskFilter />
        <TaskTable
          onTaskClick={onTaskSelected}
          selectedTask={selectedTask?.id || null}
        />
      </div>
      <div className="w-1/4 bg-white overflow-y-auto p-6">
        {selectedTask ? (
          <TaskComponent taskId={selectedTask.id} />
        ) : (
          <div>Select a task to view details</div>
        )}
      </div>
    </div>
  );
}
