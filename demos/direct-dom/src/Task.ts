import { names, projects } from "./data/tasks/createTasks.js";
import { Task } from "./data/tasks/schema.js";
import { html } from "./support/vanillajs.js";

export function TaskComponent({
  task,
  onTaskChanged,
}: {
  task: Task;
  onTaskChanged: (oldTask: Task, newTask: Task) => void;
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
    const oldTask = taskCopy;
    taskCopy = {
      ...taskCopy,
      dueDate: new Date((e.target as HTMLInputElement).value),
    };
    onTaskChanged(oldTask, taskCopy);
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
  function titleChanged(e: Event) {
    controlChange("title", e);
  }

  function controlChange(key: keyof Task, e: Event) {
    const oldTask = taskCopy;
    taskCopy = {
      ...taskCopy,
      [key]: (e.target as HTMLInputElement).value || undefined,
    };
    onTaskChanged(oldTask, taskCopy);
  }

  return html({
    assigneeChanged,
    descriptionChanged,
    dueDateChanged,
    statusChanged,
    priorityChanged,
    projectChanged,
    titleChanged,
  })`
    <div>
      <h1 class="text-xl font-semibold mb-4"><input type="text" class="w-full" value="${
        task.title
      }" events="keyup:titleChanged"></input></h1>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Assignee:</label>
        <select
          class="border rounded w-full py-2 px-3"
          events="change:assigneeChanged"
        >
          ${names.map((n) => makeOption(n, task.assignee))}
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Description:</label>
        <textarea
          class="border rounded w-full py-2 px-3"
          rows="5"
          events="change:descriptionChanged"
        >${task.description}</textarea>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Due Date:</label>
        <input
          type="date"
          class="border rounded w-full py-2 px-3"
          value="${task.dueDate.toISOString().split("T")[0]}"
          events="change:dueDateChanged"
        />
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Status:</label>
        <select
          class="border rounded w-full py-2 px-3"
          events="change:statusChanged"
        >
          <option value="todo" ${
            task.status === "todo" ? "selected" : ""
          }>To Do</option>
          <option value="in-progress" ${
            task.status === "in-progress" ? "selected" : ""
          }>In Progress</option>
          <option value="done" ${
            task.status === "done" ? "selected" : ""
          }>Done</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Priority:</label>
        <select
          class="border rounded w-full py-2 px-3"
          events="change:priorityChanged"
        >
          <option value="low" ${
            task.priority === "low" ? "selected" : ""
          }>Low</option>
          <option value="medium" ${
            task.priority === "medium" ? "selected" : ""
          }>Medium</option>
          <option value="high" ${
            task.priority === "high" ? "selected" : ""
          }>High</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-2 font-medium">Project:</label>
        <select
          class="border rounded w-full py-2 px-3"
          events="change:projectChanged"
        >
          ${projects.map((p) => makeOption(p, task.project))}
        </select>
      </div>
    </div>`;
}

function makeOption(v: string, selected: string) {
  return `<option value="${v}" ${v === selected ? "selected" : ""}>
      ${v}
    </option>
  `;
}
