import { type CSSProperties } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import IssueRow from "./IssueRow";
import { Issue } from "../../domain/SchemaType";
import OffsetVirtualTable from "./OffsetVirtualTable";
import { PersistentTreap } from "@vlcn.io/materialite";

export const ROW_HEIGHT = 36;
export interface IssueListProps {
  issues: PersistentTreap<Issue>;
  onPage: (topIdx: number) => void;
  loading: boolean;
  startIndex: number;
  totalRows: number;
}

function IssueList({
  issues,
  onPage,
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
