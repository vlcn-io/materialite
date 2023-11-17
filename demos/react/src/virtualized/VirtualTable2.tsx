import React, { memo } from "react";
import css from "./VirtualTable2.module.css";
import { useVirtual } from "react-virtual";
import { useNewView } from "@vlcn.io/materialite-react";
import { DifferenceStream } from "@vlcn.io/materialite";

export type Page<T> = {
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: T;
};
function VirtualTableBase<T>({
  header,
  footer,
  page,
  loading,
  width,
  height,
  className,
  onLoadNext,
  dataStream,
  rowRenderer,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  page: Page<T>;
  loading: boolean;
  width: string | number;
  height: string | number;
  dataStream: DifferenceStream<T>;
  onLoadNext: (page: Page<T>) => void;
  rowRenderer: (row: T) => React.ReactNode;
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loading) {
      return;
    }
    const target = e.target as HTMLElement;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 300;
    if (bottom && page.hasNext) {
      onLoadNext(page);
    }
  };
  // const [,tasks] = useNewView(() => {

  // }, [taskStream]);

  // const rowVirtualizer = useVirtual({
  //   parentRef: tableContainerRef,
  //   size: rows.length,
  //   overscan: 10,
  // });

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
        <tbody></tbody>
        {footer}
      </table>
    </div>
  );
}

export default memo(VirtualTableBase) as typeof VirtualTableBase;
