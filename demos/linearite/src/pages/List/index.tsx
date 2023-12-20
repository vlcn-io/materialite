import TopFilter from "../../components/TopFilter";
import IssueList, { ROW_HEIGHT } from "./IssueList";
import { Issue, decodeFilterState } from "../../domain/SchemaType";
import { first, useDB, useQuery2 } from "@vlcn.io/react";
import { queries } from "../../domain/queries";
import { DBName } from "../../domain/Schema";
import { useMemo, useState } from "react";

function List({ showSearch = false }) {
  const ctx = useDB(DBName);
  const filterState = decodeFilterState(
    first(useQuery2(ctx, queries.filterState).data)
  );
  // TODO: observe window height and update limit
  const pageSize = Math.floor(window.innerHeight / ROW_HEIGHT);
  const [indexOffset, setIndexOffset] = useState(0);
  const [usedIndexOffset, setUsedIndexOffset] = useState(0);
  const limit = pageSize * 3;
  const issues$ = useQuery2(ctx, queries.listIssues(filterState), [
    indexOffset,
    limit,
  ]);
  const filteredIssuesCount =
    first(useQuery2(ctx, queries.filteredIssueCount(filterState)).data)?.c ?? 0;
  const hasPrevPage = indexOffset > 0;
  const hasNextPage = filteredIssuesCount > indexOffset + issues$.data.length;
  const [lastIssues, setLastIssues] = useState(issues$.data);

  if (issues$.data !== lastIssues) {
    setUsedIndexOffset(indexOffset);
    setLastIssues(issues$.data);
  }

  // topIdx is the offset into the entire result set
  function onPage(topIdx: number) {
    if (issues$.loading) {
      return;
    }
    setIndexOffset(Math.max(topIdx - pageSize, 0));
  }

  return (
    <div className="flex flex-col flex-grow">
      <TopFilter
        filteredIssuesCount={filteredIssuesCount}
        showSearch={showSearch}
      />
      <IssueList
        issues={issues$.data}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onPage={onPage}
        loading={issues$.loading}
        startIndex={usedIndexOffset}
        totalRows={filteredIssuesCount}
      />
    </div>
  );
}

export default List;
