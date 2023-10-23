import React from "react";
import { Task } from "../data/tasks/schema.js";
import { names, projects } from "../data/tasks/createTasks.js";
type TaskComponentProps = {
  task: Task;
  onTaskChanged: (oldTask: Task, task: Task) => void;
};

export const TaskComponent: React.FC<TaskComponentProps> = ({
  task,
  onTaskChanged,
}) => {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">
        <input
          type="text"
          className="w-full"
          onChange={(e) => {
            onTaskChanged(task, {
              ...task,
              title: e.target.value,
            });
          }}
          value={task.title}
        />
      </h1>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Assignee:</label>
        <select
          className="border rounded w-full py-2 px-3"
          value={task.assignee}
          onChange={(e) =>
            onTaskChanged(task, {
              ...task,
              assignee: e.target.value,
            })
          }
        >
          {names.map((p) => (
            <option value={p} key={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Description:</label>
        <textarea
          className="border rounded w-full py-2 px-3"
          rows={5}
          value={task.description}
          onChange={(e) =>
            onTaskChanged(task, { ...task, description: e.target.value })
          }
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Due Date:</label>
        <input
          type="date"
          className="border rounded w-full py-2 px-3"
          value={task.dueDate.toISOString().split("T")[0]}
          onChange={(e) =>
            onTaskChanged(task, { ...task, dueDate: new Date(e.target.value) })
          }
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Status:</label>
        <select
          className="border rounded w-full py-2 px-3"
          value={task.status}
          onChange={(e) =>
            onTaskChanged(task, {
              ...task,
              status: e.target.value as Task["status"],
            })
          }
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Priority:</label>
        <select
          className="border rounded w-full py-2 px-3"
          value={task.priority}
          onChange={(e) =>
            onTaskChanged(task, {
              ...task,
              priority: e.target.value as Task["priority"],
            })
          }
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Project:</label>
        <select
          className="border rounded w-full py-2 px-3"
          value={task.project}
          onChange={(e) =>
            onTaskChanged(task, {
              ...task,
              project: e.target.value,
            })
          }
        >
          {projects.map((p) => (
            <option value={p} key={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
