import React, { useEffect, useState } from "react";
import { Task } from "./data/tasks/schema.js";
import { ListChildComponentProps } from "react-window";
import { VirtualTable } from "./virtualized/VirtualTable.js";
import { DifferenceStream } from "@vlcn.io/materialite";
import { PersistentTreeSink } from "@vlcn.io/materialite/sinks/PersistentTreeSink";
import { PersistentTreap } from "@vlcn.io/ds-and-algos/PersistentTreap";

type TaskTableProps = {
  tasks: DifferenceStream<Task>;
  onTaskClick: (task: Task) => void;
  selectedTask?: number;
};

export const TaskTable: React.FC<TaskTableProps> = (props) => {
  const [tasksList, setTasksList] = useState<PersistentTreap<Task> | null>(
    null
  );
  useEffect(() => {
    console.log("CREATE SINK");
    const sink = new PersistentTreeSink(props.tasks, (l, r) => l.id - r.id);
    setTasksList(sink.data);
    sink.onChange((list) => {
      setTasksList(list);
    });
    return () => {
      sink.destroy();
    };
  }, [props.tasks]);

  return (
    <div className="bg-gray-100 p-6 overflow-y-auto">
      {tasksList == null ? null : (
        <VirtualTable
          height={window.innerHeight - 200}
          width="100%"
          className="min-w-full bg-white rounded-md overflow-hidden"
          itemCount={tasksList.length}
          itemData={{
            tasks: tasksList,
            onTaskClick: props.onTaskClick,
            selectedTask: props.selectedTask,
          }}
          itemSize={5}
          header={
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-semibold">ID</th>
                <th className="text-left py-2 px-3 font-semibold">Title</th>
                <th className="text-left py-2 px-3 font-semibold">Assignee</th>
                <th className="text-left py-2 px-3 font-semibold">Due Date</th>
                <th className="text-left py-2 px-3 font-semibold">Status</th>
                <th className="text-left py-2 px-3 font-semibold">Priority</th>
                <th className="text-left py-2 px-3 font-semibold">Project</th>
                <th className="text-left py-2 px-3 font-semibold">Labels</th>
              </tr>
            </thead>
          }
          row={Row}
        />
      )}
    </div>
  );
};

function Row({
  data,
  index,
}: ListChildComponentProps<{
  tasks: PersistentTreap<Task>;
  onTaskClick: (task: Task) => void;
  selectedTask?: number;
}>) {
  const task = data.tasks.at(index)!;
  if (!task) {
    console.log(`MISSING TASK! idx: ${index}`);
    return null;
  }
  return (
    <tr
      key={task.id}
      style={{ height: 50 }}
      className={`border-t cursor-pointer ${
        task.id === data.selectedTask ? "bg-blue-200" : "hover:bg-blue-100"
      }`}
      onClick={() => data.onTaskClick(task)}
    >
      <td className="py-2 px-3">{task.id}</td>
      <td className="py-2 px-3">{task.title}</td>
      <td className="py-2 px-3">{task.assignee}</td>
      <td className="py-2 px-3">{task.dueDate.toISOString().split("T")[0]}</td>
      <td className="py-2 px-3">{task.status}</td>
      <td className="py-2 px-3">{task.priority}</td>
      <td className="py-2 px-3">{task.project}</td>
      <td className="py-2 px-3">{task.labels.join(", ")}</td>
    </tr>
  );
}
