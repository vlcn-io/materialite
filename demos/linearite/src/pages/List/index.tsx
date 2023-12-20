import TopFilter from "../../components/TopFilter";
import IssueList from "./IssueList";
import { useQuery } from "@vlcn.io/materialite-react";
import { queries } from "../../domain/queries";
import { db } from "../../domain/db";

function onPage() {}

function List({ showSearch = false }) {
  const [, filterState] = useQuery(() => queries.filters(db), []);
  const [, filteredIssuesCount] = useQuery(
    () => queries.filteredIssuesCount(db, filterState!),
    [filterState]
  );
  return (
    <div className="flex flex-col flex-grow">
      <TopFilter count={filteredIssuesCount!} showSearch={showSearch} />
      <IssueList count={filteredIssuesCount!} />
    </div>
  );
}

export default List;
