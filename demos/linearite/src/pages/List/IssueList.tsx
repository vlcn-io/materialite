import { useState, type CSSProperties } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import IssueRow from "./IssueRow";
import { FilterState, Issue } from "../../domain/SchemaType";
import { useQuery } from "@vlcn.io/materialite-react";
import { applyFilters, queries } from "../../domain/queries";
import { db } from "../../domain/db";
import { DifferenceStream } from "@vlcn.io/materialite";
import VirtualTable2 from "./VirtualTable2";

export const ROW_HEIGHT = 36;
export interface IssueListProps {
  count: number;
}

function IssueList({ count }: IssueListProps) {
  const [, filterState] = useQuery(() => queries.filters(db), []);
  // TODO: we could optimize type & search by forking off from the main query?

  // A bunch of jankery to ensure we do a single render on filter update and stream change.
  const [prevFilterState, setPrevFilterState] = useState<FilterState | null>(
    null
  );
  let initialStream: null | DifferenceStream<Issue> = null;
  if (prevFilterState !== filterState) {
    setPrevFilterState(filterState);
    const source = db.issues.getSortedSource(filterState!.orderBy);
    initialStream = applyFilters(source.stream, filterState!);
  }
  const [issueStream, setIssueStream] = useState<DifferenceStream<Issue>>(
    initialStream!
  );
  if (initialStream != null && prevFilterState != null) {
    setIssueStream(initialStream);
  }

  return (
    <div className="grow">
      <AutoSizer>
        {({ height, width }: { width: number; height: number }) => (
          <VirtualTable2
            rowRenderer={rowRenderer}
            width={width}
            height={height}
            rowHeight={ROW_HEIGHT}
            dataStream={issueStream}
            comparator={
              db.issues.getSortedSource(filterState!.orderBy).comparator
            }
            totalRows={count}
          />
        )}
      </AutoSizer>
    </div>
  );
}

function rowRenderer(issue: Issue, style: CSSProperties) {
  return <IssueRow key={`issue-${issue.id}`} issue={issue} style={style} />;
}

export default IssueList;
