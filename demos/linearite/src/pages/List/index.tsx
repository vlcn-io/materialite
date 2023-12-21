import TopFilter from "../../components/TopFilter";
import IssueList from "./IssueList";
import { useQuery } from "@vlcn.io/materialite-react";
import { queries } from "../../domain/queries";
import { db } from "../../domain/db";
import { Route, Routes, useMatch } from "react-router-dom";
import Issue from "../../pages/Issue";
import css from "./index.module.css";

function List() {
  const [, filterState] = useQuery(() => queries.filters(db), []);
  const [, filteredIssuesCount] = useQuery(
    () => queries.filteredIssuesCount(db, filterState!),
    [filterState]
  );
  const match = useMatch(
    "/issue/:id" // The route pattern to match against
  );
  const twoPane = match != null ? css.twoPane : "";

  return (
    <>
      <div className={`flex flex-col flex-1 ${twoPane}`}>
        <TopFilter count={filteredIssuesCount!} />
        <IssueList count={filteredIssuesCount!} />
      </div>
      <Routes>
        <Route path="issue/:id" element={<Issue />} />
      </Routes>
    </>
  );
}

export default List;
