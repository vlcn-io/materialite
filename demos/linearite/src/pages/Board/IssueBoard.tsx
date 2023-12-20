import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Status, StatusDisplay } from "../../types/issue";
import IssueCol from "./IssueCol";
import { ID_of, Issue, StatusType } from "../../domain/SchemaType";
import { mutations } from "../../domain/mutations";
import { useQuery } from "@vlcn.io/materialite-react";
import { queries } from "../../domain/queries";
import { db } from "../../domain/db";

export interface IssueBoardProps {}

export default function IssueBoard({}: IssueBoardProps) {
  const [, filterState] = useQuery(() => queries.filters(db), []);
  const issuesByStatus = {
    [Status.BACKLOG]: useQuery(
      () => queries.kanbanSection(db, Status.BACKLOG, filterState!),
      [filterState]
    )[1],
    [Status.TODO]: useQuery(
      () => queries.kanbanSection(db, Status.TODO, filterState!),
      [filterState]
    )[1],
    [Status.IN_PROGRESS]: useQuery(
      () => queries.kanbanSection(db, Status.IN_PROGRESS, filterState!),
      [filterState]
    )[1],
    [Status.DONE]: useQuery(
      () => queries.kanbanSection(db, Status.DONE, filterState!),
      [filterState]
    )[1],
    [Status.CANCELED]: useQuery(
      () => queries.kanbanSection(db, Status.CANCELED, filterState!),
      [filterState]
    )[1],
  } as const;

  const adjacentIssues = (
    column: StatusType,
    index: number,
    sameColumn = true,
    currentIndex: number
  ) => {
    const columnIssues = issuesByStatus[column];
    let prevIssue: Issue | null;
    let nextIssue: Issue | null;
    if (sameColumn) {
      if (currentIndex < index) {
        prevIssue = columnIssues.at(index);
        nextIssue = columnIssues.at(index + 1);
      } else {
        prevIssue = columnIssues.at(index - 1);
        nextIssue = columnIssues.at(index);
      }
    } else {
      prevIssue = columnIssues.at(index - 1);
      nextIssue = columnIssues.at(index);
    }
    return { prevIssue, nextIssue };
  };

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (destination && destination.droppableId) {
      const { prevIssue } = adjacentIssues(
        destination.droppableId as StatusType,
        destination.index,
        destination.droppableId === source.droppableId,
        source.index
      );

      // Update the issue in the database
      if (prevIssue) {
        mutations.moveIssue();
      } else {
        const issue = db.issues.get(parseInt(draggableId) as ID_of<Issue>);
        mutations.putIssue({
          ...issue!,
          status: destination.droppableId as StatusType,
        });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-1 pt-6 pl-8 overflow-scroll bg-gray-100">
        <IssueCol
          title={StatusDisplay[Status.BACKLOG]}
          status={Status.BACKLOG}
          issues={issuesByStatus[Status.BACKLOG]}
        />
        <IssueCol
          title={StatusDisplay[Status.TODO]}
          status={Status.TODO}
          issues={issuesByStatus[Status.TODO]}
        />
        <IssueCol
          title={StatusDisplay[Status.IN_PROGRESS]}
          status={Status.IN_PROGRESS}
          issues={issuesByStatus[Status.IN_PROGRESS]}
        />
        <IssueCol
          title={StatusDisplay[Status.DONE]}
          status={Status.DONE}
          issues={issuesByStatus[Status.DONE]}
        />
        <IssueCol
          title={StatusDisplay[Status.CANCELED]}
          status={Status.CANCELED}
          issues={issuesByStatus[Status.CANCELED]}
        />
      </div>
    </DragDropContext>
  );
}
