import React, { useState } from "react";
import { TaskTable } from "./TaskTable";
import { TaskComponent } from "./Task";
import { Task } from "../data/tasks/schema";
import { createTasks } from "../data/tasks/createTasks";

const tasks = createTasks(1000);
export const TaskApp: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="flex h-screen">
      {/* Left Pane - Task Table */}
      <div className="w-3/4 bg-gray-100 overflow-y-auto">
        <TaskTable tasks={tasks} onTaskClick={setSelectedTask} />
      </div>
      {/* Right Pane - Task Details */}
      <div className="w-1/4 bg-white overflow-y-auto p-6">
        {selectedTask ? (
          <TaskComponent task={selectedTask} />
        ) : (
          <div>Select a task to view details</div>
        )}
      </div>
    </div>
  );
};
