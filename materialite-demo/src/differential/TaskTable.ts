import { Task } from "../data/tasks/schema";
import { html } from "./support/vanillajs";

type TaskTableProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTask?: number;
};

export function TaskTable({
  tasks,
  onTaskClick,
  selectedTask,
}: TaskTableProps) {
  return html()`
    <div
    class="bg-gray-100 p-6 overflow-y-auto"
    style="position: relative; top: 130; height: calc(100vh - 130px);">
      <table class="min-w-full bg-white rounded-md overflow-hidden">
        <thead>
          <tr>
            <th class="text-left py-2 px-3 font-semibold">Title</th>
            <th class="text-left py-2 px-3 font-semibold">Assignee</th>
            <th class="text-left py-2 px-3 font-semibold">Due Date</th>
            <th class="text-left py-2 px-3 font-semibold">Status</th>
            <th class="text-left py-2 px-3 font-semibold">Priority</th>
            <th class="text-left py-2 px-3 font-semibold">Project</th>
            <th class="text-left py-2 px-3 font-semibold">Labels</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((task) => Task({ onTaskClick, task, selectedTask }))}
        </tbody>
      </table>
    </div>`;
}

function Task({
  onTaskClick,
  task,
  selectedTask,
}: {
  onTaskClick: (task: Task) => void;
  task: Task;
  selectedTask?: number;
}) {
  return html({
    onTaskClick: () => onTaskClick(task),
  })`<tr class="border-t cursor-pointer ${
    task.id === selectedTask ? "bg-blue-200" : "hover:bg-blue-100"
  }"
    events="click:onTaskClick"
  >
    <td class="py-2 px-3">${task.title}</td>
    <td class="py-2 px-3">${task.assignee}</td>
    <td class="py-2 px-3">
      ${task.dueDate.toISOString().split("T")[0]}
    </td>
    <td class="py-2 px-3">${task.status}</td>
    <td class="py-2 px-3">${task.priority}</td>
    <td class="py-2 px-3">${task.project}</td>
    <td class="py-2 px-3">${task.labels.join(", ")}</td>
  </tr>`;
}
