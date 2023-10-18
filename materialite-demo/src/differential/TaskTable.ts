import { DifferenceStream } from "@vlcn.io/materialite";
import { DOMSink } from "@vlcn.io/materialite/sinks/DOMSink";
import { Task } from "../data/tasks/schema.js";
import { html } from "./support/vanillajs.js";

type TaskTableProps = {
  tasks: DifferenceStream<Task>;
  onTaskClick: (task: Task) => void;
};

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const rows = tasks.map(
    (task) => [task.id, Task({ onTaskClick, task, selectedTask: 0 })] as const
  );
  const tbody = html()`<tbody></tbody>`;
  new DOMSink(tbody, rows, (l, r) => {
    return l[0] - r[0];
  });
  // TODO: lifecycle method to dispose of sink on unmount
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
        ${tbody}
      </table>
    </div>`;
}

// join with selection state
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
    <td class="py-2 px-3">${task.dueDate.toISOString().split("T")[0]}</td>
    <td class="py-2 px-3">${task.status}</td>
    <td class="py-2 px-3">${task.priority}</td>
    <td class="py-2 px-3">${task.project}</td>
    <td class="py-2 px-3">${task.labels.join(", ")}</td>
  </tr>`;
}
