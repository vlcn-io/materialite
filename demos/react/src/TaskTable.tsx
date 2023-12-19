import React, { CSSProperties, useCallback } from "react";
import { Task } from "./data/schema.js";
import { DifferenceStream } from "@vlcn.io/materialite";
import { Filter, db, taskComparator } from "./data/DB.js";
import { useQuery } from "@vlcn.io/materialite-react";
import OffsetVirtualTable from "./virtualized/OffsetVirtualTable.js";

type TaskTableProps = {
  onTaskClick: (task: Task) => void;
  selectedTask: number | null;
};

function applyFilters(
  filters: Iterable<Filter>,
  tasks: DifferenceStream<Task>
) {
  let ret = tasks;
  for (const { key, value } of filters) {
    if (!value) continue;
    ret = ret.filter((task) => {
      return task[key] === value;
    });
  }
  return ret;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  onTaskClick,
  selectedTask,
}) => {
  const tableHeight = window.innerHeight - 160;
  const rowHeight = 50;

  const [, filters] = useQuery(
    () =>
      db.appState.stream
        .filter((s): s is Filter => s._tag === "filter")
        .materialize(db.appState.comparator),
    []
  );
  const [, tasks] = useQuery(() => {
    return applyFilters(filters, db.tasks.stream).materialize(
      db.tasks.comparator
    );
  }, [filters]);

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

  const onPage = useCallback(() => {}, []);

  return (
    <div
      className="bg-gray-100 task-table"
      style={{ marginTop: 160, paddingTop: 0, paddingLeft: 30 }}
    >
      <OffsetVirtualTable
        className="bg-white rounded-xl"
        width="calc(100% - 30px)"
        height={tableHeight}
        rows={tasks}
        totalRows={db.tasks.value.size}
        startIndex={0}
        onPage={onPage}
        loading={false}
        rowHeight={rowHeight}
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
  selectedTask: number | null;
}) {
  return (
    <tr
      style={style}
      className={`border-t cursor-pointer ${
        row.id === selectedTask ? "bg-blue-200" : "hover:bg-blue-100"
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
