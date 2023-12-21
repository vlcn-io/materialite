import React, { ReactNode, memo, useState } from "react";
import css from "./VirtualTable.module.css";

/**
 * A virtual table which uses a cursor to paginate the data.
 *
 * onNextPage and onPrevPage are called when the user scrolls to the bottom or top of the table.
 *
 * Note: `onNextPage` and `onPrevPage` should pass the cursor of the item that starts the page.
 * The caller was doing this: https://github.com/vlcn-io/linearite/blob/90bafe2e5890bf5c290585e9b6d6d1a1076e769e/src/pages/List/index.tsx
 * but this was likely wrong and what caused the jumping.
 *
 * Problems with cursoring:
 * - `onNextPage` is easy. We just fetch from the cursor till limit. E.g.,
 *  `source.after(cursor).limit(limit)`
 * - `onPrevPage` is hard, however. We have to support fetching backwards since we
 *   do not know the cursor that _starts_ the page but only the cursor that _ends_ the previous page.
 *   E.g., `source.before(cursor).limit(limit)`. So Materialite needs to implement `before` and backwards iteration over sources.
 * - `onPrevPage` is pretty annoying to do in SQL for SQLite sources as it requires reversing a bunch of comparisons and re-preparing statements. E.g., https://github.com/vlcn-io/linearite/commit/90bafe2e5890bf5c290585e9b6d6d1a1076e769e#diff-3a43274e7eed34c4e02ca0957ffd5fbd38efe244b546bc9a4b463a55925ab3f7
 *
 * Cursoring, however, is the most efficient way. Offset based pagination is not efficient since it requires
 * loading all the data up to the offset.
 */
function VirtualTableBase<T>({
  rowRenderer,
  width,
  height,
  rowHeight,
  rows,
  totalRows,
  startIndex,
  onNextPage,
  onPrevPage,
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
  onNextPage: () => void;
  onPrevPage: () => void;
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
    if (loading) {
      // TODO (mlaw):
      // allow scrolling while loading if we're inside the over-scan window.
      e.preventDefault();
      target.scrollTop = prevScrollTop;
      return false;
    }
    const scrollTop = target.scrollTop;
    setScrollTop(scrollTop);

    if (Math.abs(scrollTop - prevScrollTop) > vp) {
      onJump();
    } else {
      onNearScroll();
    }

    const scrollDirection = scrollTop - prevScrollTop > 0 ? "down" : "up";

    // TODO: Need to clamp the scroll to not jump ahead more than the items loaded.

    const loadedItems = rows.length;
    const lastThirdIndex = Math.floor(loadedItems * (2 / 3));
    const firstThirdIndex = Math.floor(loadedItems * (1 / 3));
    const bottomIdx = Math.floor((scrollTop + offset + vp) / rh);
    const topIdx = Math.floor((scrollTop + offset) / rh);
    if (
      scrollDirection === "down" &&
      hasNextPage &&
      !loading &&
      bottomIdx - startIndex > lastThirdIndex
    ) {
      const pos = (lastThirdIndex + startIndex) * rh - offset - vp;
      target.scrollTop = pos;
      setPrevScrollTop(pos);
      onNextPage();
    } else if (
      scrollDirection === "up" &&
      hasPrevPage &&
      !loading &&
      topIdx - startIndex < firstThirdIndex
    ) {
      console.log("LOADING PREV PAGE");
      const pos = (firstThirdIndex + startIndex) * rh - offset;
      target.scrollTop = pos;
      setPrevScrollTop(pos);
      onPrevPage();
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
  // useEffect(() => {
  //   const current = tableContainerRef.current;
  //   if (!current) {
  //     return;
  //   }

  //   current.addEventListener("scroll", handleScroll);
  //   return () => {
  //     current.removeEventListener("scroll", handleScroll);
  //   };
  // }, [tableContainerRef.current, handleScroll]);

  const buffer = vp;
  const y = scrollTop + offset;
  let top = Math.floor((y - buffer) / rh);
  let bottom = Math.ceil((y + vp + buffer) / rh);

  // top index for items in the viewport
  top = Math.max(startIndex, top);
  // bottom index for items in the viewport
  bottom = Math.min(th / rh, bottom);

  const renderedRows: ReactNode[] = [];
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
