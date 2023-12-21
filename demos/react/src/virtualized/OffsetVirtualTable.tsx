import React, { memo, useState } from "react";
import css from "./VirtualTable.module.css";

/**
 * Same as `VirtualTable` but uses offset pagination.
 *
 * Offset pagination isn't terribly efficient for SQLite but there are ways around this:
 * 1. Creating a temp table to index the offsets
 * 2. Using cursor as a hint to find the offset?
 *
 * Offset pagination works fine in Materialite since our treap knows indices.
 *
 * Offset pagination is in some ways a requirement. If the user wants to drag and scroll,
 * well how do we jump to where they dragged? We can't do this with a cursor since we don't know the
 * cursor at an arbitrary position. We can do it with offset pagination though.
 *
 * The ideal world is probably some combination of offset pagination and cursor pagination.
 * Cursor when we can, offset when we can't.
 *
 * We will only re-fetch if we scroll into or beyond our over-scan region.
 */

function VirtualTableBase<T>({
  rowRenderer,
  width,
  height,
  rowHeight,
  rows,
  totalRows,
  startIndex,
  onPage,
  hasNextPage,
  hasPrevPage,
  loading,
  className,
}: {
  className?: string;
  width: string | number;
  height: number;
  rowHeight: number;
  rows: readonly T[];
  totalRows: number;
  startIndex: number;
  onPage: (offset: number) => void;
  loading: boolean;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  rowRenderer: (
    row: T,
    style: { [key: string]: string | number }
  ) => React.ReactNode;
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const bottomIdx = Math.floor((scrollTop + offset + vp) / rh);
    const topIdx = Math.floor((scrollTop + offset) / rh);
    if (loading) {
      if (topIdx - startIndex < 0 || bottomIdx - startIndex > rows.length) {
        e.preventDefault();
        target.scrollTop = prevScrollTop;
        return false;
      }
    }
    setScrollTop(scrollTop);

    if (Math.abs(scrollTop - prevScrollTop) > vp) {
      onJump();
    } else {
      onNearScroll();
    }

    const scrollDirection = scrollTop - prevScrollTop > 0 ? "down" : "up";

    const loadedItems = rows.length;
    const lastSixthIndex = Math.floor(loadedItems * (5 / 6));
    const firstSixthIndex = Math.floor(loadedItems * (1 / 6));
    if (
      scrollDirection === "down" &&
      hasNextPage &&
      !loading &&
      bottomIdx - startIndex > lastSixthIndex
    ) {
      onPage(topIdx);
    } else if (
      scrollDirection === "up" &&
      hasPrevPage &&
      !loading &&
      topIdx - startIndex < firstSixthIndex
    ) {
      onPage(topIdx);
    }
  };

  function onJump() {
    const viewport = tableContainerRef.current;
    if (!viewport) {
      return;
    }
    const scrollTop = viewport.scrollTop;
    const newPage = Math.floor(scrollTop * ((th - vp) / (h - vp)) * (1 / ph));
    setPage(newPage);
    setOffest(Math.round(newPage * cj));
    setPrevScrollTop(scrollTop);
  }

  function onNearScroll() {
    const viewport = tableContainerRef.current;
    if (!viewport) {
      return;
    }
    const scrollTop = viewport.scrollTop;

    // next scroll bar page
    if (scrollTop + offset > (page + 1) * ph) {
      const nextPage = page + 1;
      const nextOffset = Math.round(nextPage * cj);
      const newPrevScrollTop = scrollTop - cj;
      viewport.scrollTop = prevScrollTop;
      setPage(nextPage);
      setOffest(nextOffset);
      setPrevScrollTop(newPrevScrollTop);
    } else if (scrollTop + offset < page * ph) {
      // prev scroll bar page
      const nextPage = page - 1;
      const nextOffset = Math.round(nextPage * cj);
      const newPrevScrollTop = scrollTop + cj;
      viewport.scrollTop = prevScrollTop;
      setPage(nextPage);
      setOffest(nextOffset);
      setPrevScrollTop(newPrevScrollTop);
    } else {
      setPrevScrollTop(scrollTop);
    }
  }

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
  const [offset, setOffest] = useState(0);
  const [prevScrollTop, setPrevScrollTop] = useState(0);
  const [scrollTop, setScrollTop] = useState(
    tableContainerRef.current?.scrollTop || 0
  );
  const [lastLoading, setLastLoading] = useState(loading);
  if (lastLoading !== loading) {
    setLastLoading(loading);
    if (!loading) {
      tableContainerRef.current!.scrollTop = prevScrollTop;
    }
  }

  const buffer = vp;
  const y = scrollTop + offset;
  let top = Math.floor((y - buffer) / rh);
  let bottom = Math.ceil((y + vp + buffer) / rh);

  // top index for items in the viewport
  top = Math.max(startIndex, top);
  // bottom index for items in the viewport
  bottom = Math.min(th / rh, bottom);

  const renderedRows = [];
  for (let i = top; i <= bottom; ++i) {
    const d = rows[i - startIndex];
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
