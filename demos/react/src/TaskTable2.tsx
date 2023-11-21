import React, { CSSProperties, useCallback } from "react";
import { Task } from "./data/tasks/schema.js";
import { DifferenceStream } from "@vlcn.io/materialite";
import VirtualTable2 from "./virtualized/VirtualTable2.js";
import { taskComparator } from "./TaskApp.js";

type TaskTableProps = {
  tasks: DifferenceStream<Task>;
  onTaskClick: (task: Task) => void;
  selectedTask: Task | null;
};

export const TaskTable2: React.FC<TaskTableProps> = ({
  tasks,
  onTaskClick,
  selectedTask,
}) => {
  const rowRenderer = useCallback(
    (row: Task, style: { [key: string]: string | number }) => (
      <Row
        key={row.id}
        row={row}
        style={style}
        selectedTask={selectedTask}
        onClick={() => {
          onTaskClick(row);
        }}
      />
    ),
    [selectedTask]
  );

  return (
    <div
      className="bg-gray-100 task-table"
      style={{ marginTop: 160, paddingTop: 0, paddingLeft: 30 }}
    >
      <VirtualTable2
        className="bg-white rounded-xl"
        width="calc(100% - 30px)"
        height={window.innerHeight - 160}
        dataStream={tasks}
        rowHeight={50}
        comparator={taskComparator}
        header={
          <thead>
            <tr>
              <th className="text-left py-2 px-3 font-semibold">ID</th>
              <th className="text-left py-2 px-3 font-semibold">Title</th>
              <th className="text-left py-2 px-3 font-semibold">Assignee</th>
              <th className="text-left py-2 px-3 font-semibold">Due Date</th>
              <th className="text-left py-2 px-3 font-semibold">Status</th>
              <th className="text-left py-2 px-3 font-semibold">Priority</th>
              <th className="text-left py-2 px-3 font-semibold">Project</th>
              <th className="text-left py-2 px-3 font-semibold">Labels</th>
            </tr>
          </thead>
        }
        rowRenderer={rowRenderer}
      />
    </div>
  );
};

function Row({
  row,
  onClick,
  style,
  selectedTask,
}: {
  row: Task;
  onClick: () => void;
  style: CSSProperties;
  selectedTask: Task | null;
}) {
  return (
    <tr
      style={style}
      className={`border-t cursor-pointer ${
        row.id === selectedTask?.id ? "bg-blue-200" : "hover:bg-blue-100"
      }`}
      onClick={onClick}
    >
      <td className="py-2 px-3">{row.id.toLocaleString()}</td>
      <td className="py-2 px-3">{row.title}</td>
      <td className="py-2 px-3">{row.assignee}</td>
      <td className="py-2 px-3">{row.dueDate.toISOString().split("T")[0]}</td>
      <td className="py-2 px-3">{row.status}</td>
      <td className="py-2 px-3">{row.priority}</td>
      <td className="py-2 px-3">{row.project}</td>
      <td className="py-2 px-3">{row.labels.join(", ")}</td>
    </tr>
  );
}
