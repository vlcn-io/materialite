/**
 * - Ingest tasks
 * - Filter them
 * - Display them?
 * - Controls for editing them?
 */

import { createTasks } from "../data/tasks/createTasks";
import { TaskFilter } from "./TaskFilter";
import { TaskTable } from "./TaskTable";
import { html } from "./support/vanillajs";

const seedTasks = createTasks(1);

export function TaskApp() {
  function onFilterChange() {}
  return html()`<div class="flex h-screen">
    <div className="w-3/4 bg-gray-100 overflow-y-auto">
      ${TaskFilter({
        onFilterChange,
      })}
      ${TaskTable({
        tasks: seedTasks,
        onTaskClick: () => {},
      })}
    </div>
  </div>`;
}
