import { type CSSProperties } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import IssueRow from "./IssueRow";
import { Issue } from "../../domain/SchemaType";
import OffsetVirtualTable from "./OffsetVirtualTable";

export const ROW_HEIGHT = 36;
export interface IssueListProps {
  issues: readonly Issue[];
  onPage: (topIdx: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  loading: boolean;
  startIndex: number;
  totalRows: number;
}

function IssueList({
  issues,
  onPage,
  hasNextPage,
  hasPrevPage,
  loading,
  startIndex,
  totalRows,
}: IssueListProps) {
  return (
    <div className="grow">
      <AutoSizer>
        {({ height, width }: { width: number; height: number }) => (
          <OffsetVirtualTable
            rowRenderer={rowRenderer}
            width={width}
            height={height}
            rowHeight={ROW_HEIGHT}
            rows={issues}
            totalRows={totalRows}
            startIndex={startIndex}
            onPage={onPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            loading={loading}
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
