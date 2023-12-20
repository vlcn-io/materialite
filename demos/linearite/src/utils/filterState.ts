import { DecodedFilterState } from "../domain/SchemaType";

export function filterStateToWhere(filterState: DecodedFilterState) {
  const { status, priority, query } = filterState;
  let where = "WHERE ";
  const orig = where;
  if (status && status.length > 0) {
    where += `STATUS IN (${status.map((s) => "'" + s + "'").join(",")})`;
  }
  if (priority && priority.length > 0) {
    if (where !== orig) {
      where += " AND ";
    }
    where += `PRIORITY IN (${priority.map((s) => "'" + s + "'").join(",")})`;
  }
  if (query) {
    // TODO: description search too?
    // TODO: FTS5
    if (where !== orig) {
      where += " AND ";
    }
    where += `TITLE LIKE '%${query}%'`;
  }

  if (where == orig) {
    return "";
  }

  return where;
}

export function filterStateToOrder(filterState: DecodedFilterState) {
  if (filterState.orderBy) {
    return `ORDER BY ${filterState.orderBy} ${filterState.orderDirection}`;
  }

  return "";
}
