import { Priority, Status } from "../data/tasks/schema.js";

import {
  names,
  priorities,
  statuses,
  projects,
} from "../data/tasks/createTasks";
import { html } from "./support/vanillajs";

type TaskFilterProps = {
  onFilterChange: (filter: TaskFilter) => void;
  filter: TaskFilter;
};

export type TaskFilter = {
  assignee?: string;
  priority?: Priority;
  status?: Status;
  project?: string;
};

function makeOption(v: string, s?: string) {
  return `<option value="${v}" ${s === v ? "selected" : ""}>
      ${v}
    </option>
  `;
}

export function TaskFilter({ onFilterChange, filter }: TaskFilterProps) {
  function assigneeChange(e: Event) {
    controlChange("assignee", e);
  }
  function priorityChange(e: Event) {
    controlChange("priority", e);
  }
  function statusChange(e: Event) {
    controlChange("status", e);
  }
  function projectChange(e: Event) {
    controlChange("project", e);
  }
  function controlChange(key: keyof TaskFilter, e: Event) {
    filter = {
      ...filter,
      [key]: (e.target as HTMLInputElement).value || undefined,
    };
    onFilterChange(filter);
  }
  return html({
    assigneeChange,
    priorityChange,
    statusChange,
    projectChange,
  })`
  <div class="fixed top-0 left-0 w-3/4 bg-white p-4 z-10" style="boxShadow: 0 2px 2px -2px rgb(0 0 0 / 0.1);">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="m-2 inline-block w-24">Assignee</label>
        <select
          events="select:assigneeChange"
          class="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64">
          <option value="">Any</option>
          ${names.map((n) => makeOption(n, filter.assignee))}
        </select>
      </div>
      <div>
        <label class="m-2 inline-block w-24">Priority</label>
        <select
          events="select:priorityChange"
          class="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64">
          <option value="">Any</option>
          ${priorities.map((p) => makeOption(p, filter.priority))}
        </select>
      </div>
      <div>
        <label class="m-2 inline-block w-24">Status</label>
        <select
          events="select:statusChange"
          class="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64">
          <option value="">Any</option>
          ${statuses.map((s) => makeOption(s, filter.status))}
        </select>
      </div>
      <div>
        <label class="m-2 inline-block w-24">Project</label>
        <select
          events="select:projectChange"
          class="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64">
          <option value="">Any</option>
          ${projects.map((p) => makeOption(p, filter.project))}
        </select>
      </div>
    </div>
  </div>`;
}
