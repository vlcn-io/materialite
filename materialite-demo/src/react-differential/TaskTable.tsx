import React, { useEffect, useRef } from "react";
import { Task } from "../data/tasks/schema.js";
import { DifferenceStream } from "@vlcn.io/materialite";

type TaskTableProps = {
  tasks: DifferenceStream<Task>;
  onTaskClick: (task: Task) => void;
};

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onTaskClick }) => {
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  useEffect(() => {
    console.log(tbodyRef.current);
  }, [tbodyRef.current]);
  return (
    <div
      className="bg-gray-100 p-6 overflow-y-auto"
      style={{ position: "relative", top: 130, height: "calc(100vh - 130px)" }}
    >
      <table className="min-w-full bg-white rounded-md overflow-hidden">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 font-semibold">Title</th>
            <th className="text-left py-2 px-3 font-semibold">Assignee</th>
            <th className="text-left py-2 px-3 font-semibold">Due Date</th>
            <th className="text-left py-2 px-3 font-semibold">Status</th>
            <th className="text-left py-2 px-3 font-semibold">Priority</th>
            <th className="text-left py-2 px-3 font-semibold">Project</th>
            <th className="text-left py-2 px-3 font-semibold">Labels</th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}></tbody>
      </table>
    </div>
  );
};

function TaskRow({
  task,
  onTaskClick,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
}) {
  return (
    <tr
      key={task.id}
      className={`border-t cursor-pointer ${
        task.selected ? "bg-blue-200" : "hover:bg-blue-100"
      }`}
      onClick={() => onTaskClick(task)}
    >
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
