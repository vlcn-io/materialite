import { DifferenceStream } from "@vlcn.io/materialite";
import { DB } from "./db";
import { FilterState, Issue, StatusType } from "./SchemaType";
export const queries = {
  filters(db: DB) {
    return db.appState.stream
      .filter((s) => s._tag === "filter")
      .materializeValue(null);
  },

  selected(db: DB) {
    return db.appState.stream
      .filter((s) => s._tag === "selected")
      .materializeValue(null);
  },

  issues(db: DB, filterState: FilterState) {
    const source = db.issues.getSortedSource(filterState.orderBy);
    return applyFilters(source.stream, filterState).materialize(
      source.comparator
    );
  },

  kanbanSection(db: DB, status: StatusType, filterState: FilterState) {
    const source = db.issues.getSortedSource("kanbanorder");
    return applyFilters(
      source.stream.filter((i) => i.status === status),
      filterState
    ).materialize(source.comparator);
  },
};

function applyFilters(
  stream: DifferenceStream<Issue>,
  filterState: FilterState
) {
  if (filterState.query) {
    stream = stream.filter((i) => i.title.includes(filterState.query!));
  }
  if (filterState.status) {
    stream = stream.filter((i) => filterState.status!.includes(i.status));
  }
  if (filterState.priority) {
    stream = stream.filter((i) => filterState.priority!.includes(i.priority));
  }
  return stream;
}
