import React from "react";
import { useState, useRef, useContext } from "react";
import { FixedSizeList, FixedSizeListProps } from "react-window";

/** Context for cross component communication */
const VirtualTableContext = React.createContext<{
  top: number;
  setTop: (top: number) => void;
  header: React.ReactNode;
  footer: React.ReactNode;
}>({
  top: 0,
  setTop: (value: number) => {},
  header: <></>,
  footer: <></>,
});

/** The virtual table. It basically accepts all of the same params as the original FixedSizeList.*/
export function VirtualTable({
  row,
  header,
  footer,
  ...rest
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  row: FixedSizeListProps["children"];
} & Omit<FixedSizeListProps, "children" | "innerElementType">) {
  const listRef = useRef<FixedSizeList | null>();
  const [top, setTop] = useState(0);

  return (
    <VirtualTableContext.Provider value={{ top, setTop, header, footer }}>
      <FixedSizeList
        {...rest}
        innerElementType={Inner}
        onItemsRendered={(props) => {
          const style =
            listRef.current &&
            // @ts-ignore private method access
            listRef.current._getItemStyle(props.overscanStartIndex);
          setTop((style && style.top) || 0);

          // Call the original callback
          rest.onItemsRendered && rest.onItemsRendered(props);
        }}
        ref={(el) => (listRef.current = el)}
      >
        {row}
      </FixedSizeList>
    </VirtualTableContext.Provider>
  );
}

/** The Row component. This should be a table row, and noted that we don't use the style that regular `react-window` examples pass in.*/
function Row({ index }: { index: number }) {
  return (
    <tr>
      {/** Make sure your table rows are the same height as what you passed into the list... */}
      <td style={{ height: "36px" }}>Row {index}</td>
      <td>Col 2</td>
      <td>Col 3</td>
      <td>Col 4</td>
    </tr>
  );
}

/**
 * The Inner component of the virtual list. This is the "Magic".
 * Capture what would have been the top elements position and apply it to the table.
 * Other than that, render an optional header and footer.
 **/
const Inner = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  function Inner({ children, ...rest }, ref) {
    const { header, footer, top } = useContext(VirtualTableContext);
    return (
      <div {...rest} ref={ref}>
        <table style={{ top, position: "absolute", width: "100%" }}>
          {header}
          <tbody>{children}</tbody>
          {footer}
        </table>
      </div>
    );
  }
);
