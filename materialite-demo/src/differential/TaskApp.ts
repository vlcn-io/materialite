/**
 * - Ingest tasks
 * - Filter them
 * - Display them?
 * - Controls for editing them?
 */

import { createTasks } from "../data/tasks/createTasks.js";
import { Task } from "../data/tasks/schema.js";
import { TaskComponent } from "./Task.js";
import { TaskFilter } from "./TaskFilter.js";
import { TaskTable } from "./TaskTable.js";
import { html } from "./support/vanillajs.js";
import { Materialite } from "@vlcn.io/materialite";

const seedTasks = createTasks(1000);

export function TaskApp() {
  const materialite = new Materialite();
  const tasks = materialite.newSet<Task>();
  let filter: TaskFilter = {};

  let filteredTasks = tasks.stream.filter((task) => {
    let keep = true;
    for (const k in filter) {
      const casted = k as keyof TaskFilter;
      if (filter[casted] == null) {
        continue;
      }
      keep = task[casted] === filter[casted];
      if (!keep) {
        return false;
      }
    }

    return keep;
  });

  function onFilterChange() {}

  function onTaskClick(task: Task) {
    const component = TaskComponent({
      onTaskChanged: (oldTask, newTask) => {
        materialite.tx(() => {
          tasks.delete(oldTask);
          tasks.add(newTask);
        });
      },
      task,
    });
    selectedSection.removeChild(selectedSection.firstChild!);
    selectedSection.appendChild(component);
  }

  const selectedSection = html()`<div><span>Select a task to view details</span></div>`;

  const ret = html()`<div class="flex h-screen">
    <div class="w-3/4 bg-gray-100 overflow-y-auto">
      ${TaskFilter({
        onFilterChange,
      })}
      ${TaskTable({
        tasks: filteredTasks,
        onTaskClick,
      })}
    </div>
    <div class="w-1/4 bg-white overflow-y-auto p-6">
      ${selectedSection}
    </div>
  </div>`;

  tasks.addAll(seedTasks);
  return ret;
}
