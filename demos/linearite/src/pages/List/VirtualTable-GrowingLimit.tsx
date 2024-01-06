import React, { memo, useRef, useState } from "react";
import css from "./VirtualTable.module.css";
import { useQuery } from "@vlcn.io/materialite-react";
import { DifferenceStream, PersistentTreeView } from "@vlcn.io/materialite";

/**
 * A virtual table where `onNextPage` we just increase the limit of the source query to load more data.
 *
 * `Materialite` currently efficiently supports this with a `rematerialize` operator. This
 * hoists a cursor to the source and resumes the query from that cursor to grab `new_limit - old_limit` items
 * and add to the current view.
 *
 * There is never an `onPrevPage` as all data for previous pages is always loaded.
 */
type Comparator<T> = (a: T, b: T) => number;
function VirtualTableBase<T>({
  rowRenderer,
  width,
  height,
  rowHeight,
  totalRows,
  dataStream,
  className,
  comparator,
}: {
  className?: string;
  width: string | number;
  height: number;
  rowHeight: number;
  totalRows: number;
  dataStream: DifferenceStream<T>;
  rowRenderer: (
    row: T,
    style: { [key: string]: string | number }
  ) => React.ReactNode;
  comparator: Comparator<T>;
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const pageSize = Math.ceil(height / rowHeight);
  // load 2 pages to start
  const [limit, setLimit] = useState(pageSize * 2);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;
    setScrollTop(scrollTop);

    let nextOffset = offset;
    if (Math.abs(scrollTop - prevScrollTop) > vp) {
      nextOffset = onJump();
    } else {
      nextOffset = onNearScroll();
    }

    // TODO: change this so scroll bar represents
    // total height and we page in when hitting a virtual region that is missing data.
    const bottomIdx = Math.floor((scrollTop + nextOffset + vp) / rh);
    const scrollDirection = scrollTop - prevScrollTop > 0 ? "down" : "up";

    if (
      scrollDirection === "down" &&
      bottomIdx >= data.size - 1 &&
      (data.size >= limit || lastDataSize !== data.size)
    ) {
      setLastDataSize(data.size);
      const newLimit = bottomIdx + pageSize * 4;
      setLimit(newLimit);
    }
  };

  function onJump() {
    const viewport = tableContainerRef.current;
    if (!viewport) {
      return offset;
    }
    const scrollTop = viewport.scrollTop;
    const newPage = Math.floor(scrollTop * ((th - vp) / (h - vp)) * (1 / ph));
    setPage(newPage);
    const nextOffset = Math.round(newPage * cj);
    setOffset(nextOffset);
    setPrevScrollTop(scrollTop);
    return nextOffset;
  }

  function onNearScroll() {
    const viewport = tableContainerRef.current;
    if (!viewport) {
      return offset;
    }
    const scrollTop = viewport.scrollTop;

    // next page
    let nextOffset = offset;
    if (scrollTop + offset > (page + 1) * ph) {
      const nextPage = page + 1;
      nextOffset = Math.round(nextPage * cj);
      const newPrevScrollTop = scrollTop - cj;
      viewport.scrollTop = prevScrollTop;
      setPage(nextPage);
      setOffset(nextOffset);
      setPrevScrollTop(newPrevScrollTop);
    } else if (scrollTop + offset < page * ph) {
      // prev page
      const nextPage = page - 1;
      nextOffset = Math.round(nextPage * cj);
      const newPrevScrollTop = scrollTop + cj;
      viewport.scrollTop = prevScrollTop;
      setPage(nextPage);
      setOffset(nextOffset);
      setPrevScrollTop(newPrevScrollTop);
    } else {
      setPrevScrollTop(scrollTop);
    }

    return nextOffset;
  }

  const viewRef = useRef<PersistentTreeView<T>>();
  const [, data] = useQuery(() => {
    let ret: PersistentTreeView<T>;
    if (viewRef.current != null && dataStream === viewRef.current.stream) {
      ret = viewRef.current.rematerialize(limit);
    } else {
      setLimit(pageSize * 2);
      ret = dataStream.materialize(comparator, {
        wantInitialData: true,
        limit: pageSize * 2,
      });

      // in case we are at the bottom already. e.g., after filter changes
      const target = tableContainerRef.current;
      if (target) {
        target.scrollTop = 0;
      }
    }
    viewRef.current = ret;
    return ret;
  }, [dataStream, limit]);
  const [lastDataSize, setLastDataSize] = useState(data.size);

  const items = totalRows;
  const itemSize = rowHeight;
  const th = items * itemSize;
  const h = 33554400;
  const ph = h / 100;
  const n = Math.ceil(th / ph);
  const vp = height;
  const rh = rowHeight;
  const cj = (th - h) / (n - 1) > 0 ? (th - h) / (n - 1) : 1; // "jumpiness" coefficient
  const contentHeight = h > th ? th : h;

  // virtual pages, not real pages. Unrelated to items entirely.
  const [page, setPage] = useState(0);
  const [offset, setOffset] = useState(0);
  const [prevScrollTop, setPrevScrollTop] = useState(0);
  const [scrollTop, setScrollTop] = useState(
    tableContainerRef.current?.scrollTop || 0
  );

  const buffer = vp;
  const y = scrollTop + offset;
  let top = Math.floor((y - buffer) / rh);
  let bottom = Math.ceil((y + vp + buffer) / rh);

  // top index for items in the viewport
  top = Math.max(0, top);
  // bottom index for items in the viewport
  bottom = Math.min(th / rh, bottom);

  const renderedRows = [];
  for (let i = top; i <= bottom; ++i) {
    const d = data.at(i);
    if (!d) {
      break;
    }
    renderedRows.push(
      rowRenderer(d, {
        height: rh,
        top: i * rh - offset,
        position: "absolute",
      })
    );
  }

  return (
    <div
      className={`${css.container} ${className}`}
      onScroll={handleScroll}
      ref={tableContainerRef}
      style={{
        width,
        height,
        position: "relative",
      }}
    >
      <div
        style={{
          height: contentHeight,
          position: "relative",
          overflow: "hidden",
        }}
      ></div>
      {renderedRows}
    </div>
  );
}

export default memo(VirtualTableBase) as typeof VirtualTableBase;
