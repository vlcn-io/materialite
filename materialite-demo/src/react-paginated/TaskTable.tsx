import React from "react";
import { Task } from "../data/tasks/schema.js";
import { ListChildComponentProps } from "react-window";
import { VirtualTable } from "../virtualized/VirtualTable.js";

type TaskTableProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTask?: number;
};

export const TaskTable: React.FC<TaskTableProps> = (props) => {
  return (
    <div
      className="bg-gray-100 p-6 overflow-y-auto"
      style={{ position: "relative", top: 130, height: "calc(100vh - 130px)" }}
    >
      <VirtualTable
        height={window.innerHeight - 200}
        width="100%"
        className="min-w-full bg-white rounded-md overflow-hidden"
        itemCount={props.tasks.length}
        itemData={props}
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
    </div>
  );
};

function Row({ data, index }: ListChildComponentProps<TaskTableProps>) {
  const task = data.tasks[index];
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
