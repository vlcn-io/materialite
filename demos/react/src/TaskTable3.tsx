import React from "react";

import css from "./virtualized/VirtualTable2.module.css";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtual } from "react-virtual";
import { Task } from "./data/tasks/schema";

export default function TaskTable3() {
  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const columns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 60,
      },
      {
        accessorKey: "assignee",
      },
      {
        accessorKey: "title",
      },
      {
        accessorKey: "dueDate",
        cell: (info) => info.getValue<Date>().toLocaleString(),
        header: "Due Date",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "priority",
      },
      {
        accessorKey: "labels",
        cell: (info) => info.getValue<string[]>().join(", "),
      },
      {
        accessorKey: "project",
      },
    ],
    []
  );

  const isFetching = false;
  const isLoading = false;
  function fetchNextPage() {}
  // const { data, fetchNextPage, isFetching, isLoading } =
  //   useInfiniteQuery<PersonApiResponse>(
  //     ["table-data", sorting], //adding sorting state as key causes table to reset and fetch from new beginning upon sort
  //     async ({ pageParam = 0 }) => {
  //       const start = pageParam * fetchSize;
  //       const fetchedData = fetchData(start, fetchSize, sorting); //pretend api call
  //       return fetchedData;
  //     },
  //     {
  //       getNextPageParam: (_lastGroup, groups) => groups.length,
  //       keepPreviousData: true,
  //       refetchOnWindowFocus: false,
  //     }
  //   );

  //we must flatten the array of arrays from the useInfiniteQuery hook
  const flatData: Task[] = [];
  const totalDBRowCount = 0;
  const totalFetched = flatData.length;

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = React.useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
        if (
          scrollHeight - scrollTop - clientHeight < 300 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount]
  );

  //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  React.useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: -1,
  });

  const { rows } = table.getRowModel();

  //Virtualizing is optional, but might be necessary if we are going to potentially have hundreds or thousands of rows
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 10,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  if (isLoading) {
    return <>Loading...</>;
  }

  return (
    <div
      className={`${css.container} bg-gray-100 p-6 task-table bg-white`}
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
      ref={tableContainerRef}
      style={{
        width: "calc(100% - 60px)",
        height: window.innerHeight - 160,
        marginTop: 160,
        marginLeft: 30,
      }}
    >
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<Task>;
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
