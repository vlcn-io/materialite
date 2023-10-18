import { names, projects } from "../data/tasks/createTasks";
import { Task } from "../data/tasks/schema";
import { html } from "./support/vanillajs";

export function TaskComponent({
  task,
  onTaskChanged,
}: {
  task: Task;
  onTaskChanged: (task: Task) => void;
}) {
  // TODO: undirectional rather than squirreling away a copy
  let taskCopy = { ...task };
  function assigneeChanged(e: Event) {
    controlChange("assignee", e);
  }
  function descriptionChanged(e: Event) {
    controlChange("assignee", e);
  }
  function dueDateChanged(e: Event) {
    taskCopy = {
      ...taskCopy,
      dueDate: new Date((e.target as HTMLInputElement).value),
    };
    onTaskChanged(taskCopy);
  }
  function statusChanged(e: Event) {
    controlChange("assignee", e);
  }
  function priorityChanged(e: Event) {
    controlChange("assignee", e);
  }
  function projectChanged(e: Event) {
    controlChange("assignee", e);
  }

  function controlChange(key: keyof Task, e: Event) {
    taskCopy = {
      ...taskCopy,
      [key]: (e.target as HTMLInputElement).value || undefined,
    };
    onTaskChanged(taskCopy);
  }

  return html({
    assigneeChanged,
    descriptionChanged,
    dueDateChanged,
    statusChanged,
    priorityChanged,
    projectChanged,
  })`
    <div>
      <h1 class="text-xl font-semibold mb-4">${task.title}</h1>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Assignee:</label>
        <select
          class="border rounded w-full py-2 px-3"
          value="${task.assignee}"
          events="onChange:assigneeChanged"
        >
          ${names.map(makeOption)}
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Description:</label>
        <textarea
          class="border rounded w-full py-2 px-3"
          rows="5"
          value="${task.description}"
          events="onChange:descriptionChanged"
        ></textarea>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Due Date:</label>
        <input
          type="date"
          class="border rounded w-full py-2 px-3"
          value="${task.dueDate.toISOString().split("T")[0]}"
          events="onChange:dueDateChanged"
        />
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Status:</label>
        <select
          class="border rounded w-full py-2 px-3"
          value="${task.status}"
          events="onChange:statusChanged"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Priority:</label>
        <select
          class="border rounded w-full py-2 px-3"
          value="${task.priority}"
          events="onChange:priorityChanged"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Project:</label>
        <select
          class="border rounded w-full py-2 px-3"
          value="${task.project}"
          events="onChange:projectChanged"
        >
          ${projects.map(makeOption)}
        </select>
      </div>
    </div>`;
}

function makeOption(v: string) {
  return `<option value="${v}">
      ${v}
    </option>
  `;
}
