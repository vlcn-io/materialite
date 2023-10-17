import React from "react";
import { Task } from "../data/tasks/schema";

type TaskTableProps = {
  tasks: Task[];
  onTaskClick: (t: Task) => void;
};

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onTaskClick }) => {
  return (
    <div className="overflow-x-auto bg-gray-100 p-6">
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
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="border-t"
              onClick={() => onTaskClick(task)}
            >
              <td className="py-2 px-3">{task.title}</td>
              <td className="py-2 px-3">{task.assignee}</td>
              <td className="py-2 px-3">
                {task.dueDate.toISOString().split("T")[0]}
              </td>
              <td className="py-2 px-3">{task.status}</td>
              <td className="py-2 px-3">{task.priority}</td>
              <td className="py-2 px-3">{task.project}</td>
              <td className="py-2 px-3">{task.labels.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
