import React, { useState } from "react";
import { Task } from "../data/tasks/schema";
type TaskComponentProps = {
  task: Task;
};

export const TaskComponent: React.FC<TaskComponentProps> = ({ task }) => {
  const [localTask, setLocalTask] = useState(task);
  const [propTask, setPropTask] = useState(task);
  if (task != propTask) {
    setPropTask(task);
    setLocalTask(task);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{localTask.title}</h1>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Assignee:</label>
        <input
          className="border rounded w-full py-2 px-3"
          value={localTask.assignee}
          onChange={(e) =>
            setLocalTask({ ...localTask, assignee: e.target.value })
          }
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Description:</label>
        <textarea
          className="border rounded w-full py-2 px-3"
          rows={5}
          value={localTask.description}
          onChange={(e) =>
            setLocalTask({ ...localTask, description: e.target.value })
          }
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Due Date:</label>
        <input
          type="date"
          className="border rounded w-full py-2 px-3"
          value={localTask.dueDate.toISOString().split("T")[0]}
          onChange={(e) =>
            setLocalTask({ ...localTask, dueDate: new Date(e.target.value) })
          }
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Status:</label>
        <select
          className="border rounded w-full py-2 px-3"
          value={localTask.status}
          onChange={(e) =>
            setLocalTask({
              ...localTask,
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
          value={localTask.priority}
          onChange={(e) =>
            setLocalTask({
              ...localTask,
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
        <input
          className="border rounded w-full py-2 px-3"
          value={localTask.project}
          onChange={(e) =>
            setLocalTask({ ...localTask, project: e.target.value })
          }
        />
      </div>
      {/* Additional fields like labels can be added similarly */}
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Save Changes
      </button>
    </div>
  );
};
