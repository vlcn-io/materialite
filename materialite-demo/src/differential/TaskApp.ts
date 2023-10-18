/**
 * - Ingest tasks
 * - Filter them
 * - Display them?
 * - Controls for editing them?
 */

import { createTasks } from "../data/tasks/createTasks";
import { Task } from "../data/tasks/schema";
import { TaskComponent } from "./Task";
import { TaskFilter } from "./TaskFilter";
import { TaskTable } from "./TaskTable";
import { html } from "./support/vanillajs";

const seedTasks = createTasks(1000);

export function TaskApp() {
  function onFilterChange() {}
  function onTaskClick(task: Task) {
    const component = TaskComponent({
      onTaskChanged: (task) => {
        // TODO: update the task in the list
        // guess we need to sink to a map of tasks
        // so we can look it up?
      },
      task,
    });
    selectedSection.removeChild(selectedSection.firstChild!);
    selectedSection.appendChild(component);
  }

  const selectedSection = html()`<div><span>Select a task to view details</span></div>`;

  return html()`<div class="flex h-screen">
    <div class="w-3/4 bg-gray-100 overflow-y-auto">
      ${TaskFilter({
        onFilterChange,
      })}
      ${TaskTable({
        tasks: seedTasks,
        onTaskClick,
      })}
    </div>
    <div class="w-1/4 bg-white overflow-y-auto p-6">
      ${selectedSection}
    </div>
  </div>`;
}
