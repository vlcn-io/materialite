import React, { memo } from "react";
import css from "./VirtualTable2.module.css";
import { useVirtual } from "react-virtual";
import { useNewView } from "@vlcn.io/materialite-react";
import { DifferenceStream } from "@vlcn.io/materialite";
import { Comparator } from "@vlcn.io/ds-and-algos/types";

function VirtualTableBase<T>({
  header,
  footer,
  rowRenderer,
  width,
  height,
  dataStream,
  className,
  comparator,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width: string | number;
  height: string | number;
  dataStream: DifferenceStream<T>;
  rowRenderer: (row: T) => React.ReactNode;
  comparator: Comparator<T>;
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 300;
    if (bottom) {
      // and not loading
      // and have next page
      // onLoadNext(page);
    }
  };
  const [, data] = useNewView(
    () => dataStream.materialize(comparator),
    [dataStream]
  );

  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: data.size,
    overscan: 10,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div
      className={`${css.container} ${className}`}
      onScroll={handleScroll}
      ref={tableContainerRef}
      style={{
        width,
        height,
      }}
    >
      <table style={{ width: "100%" }} className="table">
        {header}
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = data.at(virtualRow.index)!;
            return rowRenderer(row);
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </tbody>
        {footer}
      </table>
    </div>
  );
}

export default memo(VirtualTableBase) as typeof VirtualTableBase;
