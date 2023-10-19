import React from "react";
import { Task } from "../data/tasks/schema.js";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

type TaskTableProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTask?: number;
};

export const TaskTable: React.FC<TaskTableProps> = (props) => {
  return (
    <div
      className="bg-gray-100 p-6 overflow-y-auto"
      style={{ position: "relative", top: 130, height: "calc(100vh - 130px)" }}
    >
      <div className="table min-w-full bg-white rounded-md overflow-hidden">
        <div className="table-header">
          <div className="table-cell text-left py-2 px-3 font-semibold">ID</div>
          <div className="table-cell text-left py-2 px-3 font-semibold">
            Title
          </div>
          <div className="table-cell -left py-2 px-3 font-semibold">
            Assignee
          </div>
          <div className="table-cell text-left py-2 px-3 font-semibold">
            Due Date
          </div>
          <div className="table-cell -left py-2 px-3 font-semibold">Status</div>
          <div className="table-cell text-left py-2 px-3 font-semibold">
            Priority
          </div>
          <div className="table-cell text-left py-2 px-3 font-semibold">
            Project
          </div>
          <div className="table-cell text-left py-2 px-3 font-semibold">
            Labels
          </div>
        </div>
        <AutoSizer>
          {({ width, height }) => {
            return (
              <List
                itemCount={props.tasks.length}
                height={height}
                width={width}
                itemData={props}
                itemSize={50}
              >
                {Row}
              </List>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

function Row({ data, index, style }: ListChildComponentProps<TaskTableProps>) {
  const task = data.tasks[index];
  return (
    <div
      key={task.id}
      style={style}
      className={`table-row border-t cursor-pointer ${
        task.id === data.selectedTask ? "bg-blue-200" : "hover:bg-blue-100"
      }`}
      onClick={() => data.onTaskClick(task)}
    >
      <div className="table-cell py-2 px-3">{task.id}</div>
      <div className="table-cell py-2 px-3">{task.title}</div>
      <div className="table-cell py-2 px-3">{task.assignee}</div>
      <div className="table-cell py-2 px-3">
        {task.dueDate.toISOString().split("T")[0]}
      </div>
      <div className="table-cell py-2 px-3">{task.status}</div>
      <div className="table-cell py-2 px-3">{task.priority}</div>
      <div className="table-cell py-2 px-3">{task.project}</div>
      <div className="table-cell py-2 px-3">{task.labels.join(", ")}</div>
    </div>
  );
}
