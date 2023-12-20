import TopFilter from "../../components/TopFilter";
import IssueList from "./IssueList";
import { useQuery } from "@vlcn.io/materialite-react";
import { queries } from "../../domain/queries";
import { db } from "../../domain/db";

function onPage() {}

function List({ showSearch = false }) {
  const [, filterState] = useQuery(() => queries.filters(db), []);
  const [, issues] = useQuery(
    () => queries.issues(db, filterState!),
    [filterState]
  );

  return (
    <div className="flex flex-col flex-grow">
      <TopFilter filteredIssuesCount={issues.size} showSearch={showSearch} />
      <IssueList
        issues={issues}
        onPage={onPage}
        loading={false}
        startIndex={0}
        totalRows={issues.size}
      />
    </div>
  );
}

export default List;
