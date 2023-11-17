import { memo } from "react";
import css from "./VirtualTable2.module.css";

export type Page<T> = {
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: T;
  prevCursor?: T;
};
function VirtualTableBase<T>({
  header,
  children,
  footer,
  page,
  loading,
  width,
  height,
  onLoadNext,
  onLoadPrev,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  page: Page<T>;
  loading: boolean;
  width: string | number;
  height: string | number;
  onLoadNext: (page: Page<T>) => void;
  onLoadPrev: (page: Page<T>) => void;
}) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loading) {
      return;
    }
    const target = e.target as HTMLElement;
    const bottom =
      target.scrollHeight - target.scrollTop >= target.clientHeight - 30;
    const top = target.scrollTop <= 30;
    if (bottom && page.hasNext) {
      // Load more data
      onLoadNext(page);
    } else if (top && page.hasNext) {
      onLoadPrev(page);
    }
  };

  return (
    <div
      className={css.container}
      onScroll={handleScroll}
      style={{
        width,
        height,
      }}
    >
      <table style={{ width }}>
        {header}
        <tbody>{children}</tbody>
        {footer}
      </table>
    </div>
  );
}

export const VirtualTable2 = memo(VirtualTableBase);
