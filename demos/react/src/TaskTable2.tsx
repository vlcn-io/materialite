import React, { useCallback } from "react";
import { Task } from "./data/tasks/schema.js";
import { DifferenceStream } from "@vlcn.io/materialite";
import { Page } from "./virtualized/VirtualTable2.js";
import VirtualTable2 from "./virtualized/VirtualTable2.js";

type TaskTableProps = {
  tasks: DifferenceStream<Task>;
  onTaskClick: (task: Task) => void;
  selectedTask?: number;
};

const page: Page<Task> = {
  hasNext: true,
  hasPrev: false,
};
export const TaskTable2: React.FC<TaskTableProps> = ({ tasks }) => {
  const onLoadNext = useCallback(() => {
    console.log("loading next");
  }, []);
  const rowRenderer = useCallback(
    (row: Task) => <Row row={row} onClick={() => {}} />,
    []
  );

  return (
    <div
      className="bg-gray-100 task-table"
      style={{ marginTop: 160, paddingTop: 0, paddingLeft: 30 }}
    >
      <VirtualTable2
        page={page}
        className="bg-white rounded-xl"
        width="calc(100% - 30px)"
        height={window.innerHeight - 160}
        loading={false}
        dataStream={tasks}
        onLoadNext={onLoadNext}
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

function Row({ row, onClick }: { row: Task; onClick: () => void }) {
  return (
    <tr
      style={{ height: 50 }}
      className={`border-t cursor-pointer ${
        row.id === 1 ? "bg-blue-200" : "hover:bg-blue-100"
      }`}
      onClick={onClick}
    >
      <td className="py-2 px-3">{row.id}</td>
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
