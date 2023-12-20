import React, { memo, useState } from "react";
import css from "./VirtualTable.module.css";

/**
 * - over-scan on rows
 * - keep track of offset start for row set
 *
 * "fetchNextPage(startIndex, startCursor)"
 * page: startIndex
 *
 * fetchNextPage can over-scan to pull in before window and after window items.
 * 2 windows worth of items?
 * Half window before and half window after?
 * Or 3 windows worth of items?
 *
 * @param param0
 * @returns
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
