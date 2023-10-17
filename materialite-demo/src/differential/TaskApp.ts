/**
 * - Ingest tasks
 * - Filter them
 * - Display them?
 * - Controls for editing them?
 */

import { createTasks } from "../data/tasks/createTasks";
import { html } from "./support/vanillajs";

const seedTasks = createTasks(1000);

export function TaskApp() {
  return html({
    clicked(e) {
      console.log(e);
    },
  })`<div events="click:clicked">Hello world!</div>`;
}
