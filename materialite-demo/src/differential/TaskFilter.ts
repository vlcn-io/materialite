import { Priority, Status } from "../data/tasks/schema";

import {
  names,
  priorities,
  statuses,
  projects,
} from "../data/tasks/createTasks";
import { html } from "./support/vanillajs";

type TaskFilterProps = {
  onFilterChange: (filter: TaskFilter) => void;
};

export type TaskFilter = {
  assignee?: string;
  priority?: Priority;
  status?: Status;
  project?: string;
};

function makeOption(v: string) {
  return `<option value="${v}">
      ${v}
    </option>
  `;
}

export function TaskFilter({ onFilterChange }: TaskFilterProps) {
  return html()`<div class="fixed top-0 left-0 w-3/4 bg-white p-4 z-10" style="boxShadow: 0 2px 2px -2px rgb(0 0 0 / 0.1);">
    <div class="grid grid-cols-2 gap-4">
        <div>
        <label class="m-2 inline-block w-24">Assignee</label>
        <select
          events="change:onFilterChange"
          class="bg-green-100 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-64">
          <option value="">Any</option>
          ${names.map(makeOption)}
        </select>
      </div>
    </div>
  </div>`;
}
