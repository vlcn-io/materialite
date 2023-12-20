import { useQuery } from "@vlcn.io/materialite-react";
import TopFilter from "../../components/TopFilter";
import { db } from "../../domain/db";
import { queries } from "../../domain/queries";
import IssueBoard from "./IssueBoard";

function Board() {
  const [, filterState] = useQuery(() => queries.filters(db), []);
  const [, filteredIssuesCount] = useQuery(
    () => queries.filteredIssuesCount(db, filterState!),
    [filterState]
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopFilter
        title="Board"
        filteredIssuesCount={filteredIssuesCount!}
        hideSort={true}
      />
      <IssueBoard />
    </div>
  );
}

export default Board;
