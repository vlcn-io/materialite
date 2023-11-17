import React, { memo, useState } from "react";
import css from "./VirtualTable2.module.css";
import { useNewView } from "@vlcn.io/materialite-react";
import { DifferenceStream } from "@vlcn.io/materialite";
import { Comparator } from "@vlcn.io/ds-and-algos/types";

function VirtualTableBase<T>({
  header,
  footer,
  rowRenderer,
  width,
  height,
  rowHeight,
  dataStream,
  className,
  comparator,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width: string | number;
  height: number;
  rowHeight: number;
  dataStream: DifferenceStream<T>;
  rowRenderer: (
    row: T,
    style: { [key: string]: string | number }
  ) => React.ReactNode;
  comparator: Comparator<T>;
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  // use a ref for scroll position?
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;
    setScrollTop(scrollTop);

    if (Math.abs(scrollTop - prevScrollTop) > vp) {
      onJump();
    } else {
      onNearScroll();
    }

    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 300;
    if (bottom) {
      // and not loading
      // and have next page
      // onLoadNext(page);
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

    // next page
    if (scrollTop + offset > (page + 1) * ph) {
      const nextPage = page + 1;
      const nextOffset = Math.round(nextPage * cj);
      const newPrevScrollTop = scrollTop - cj;
      viewport.scrollTop = prevScrollTop;
      setPage(nextPage);
      setOffest(nextOffset);
      setPrevScrollTop(newPrevScrollTop);
    } else if (scrollTop + offset < page * ph) {
      // prev page
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

  const [, data] = useNewView(
    () => dataStream.materialize(comparator),
    [dataStream]
  );

  const items = data.size;
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
      rowRenderer(d, { position: "absolute", top: i * rh - offset, height: rh })
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
      }}
    >
      <div
        style={{
          height: contentHeight,
          minHeight: contentHeight,
          maxHeight: contentHeight,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%" }} className="table">
          {header}
          <tbody style={{ position: "relative" }}>{renderedRows}</tbody>
          {footer}
        </table>
      </div>
    </div>
  );
}

export default memo(VirtualTableBase) as typeof VirtualTableBase;
