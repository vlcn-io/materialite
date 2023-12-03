import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { useMemo, useState, useEffect } from 'react'
import { Status, StatusDisplay } from '../../types/issue'
import IssueCol from './IssueCol'
import { Issue, StatusType } from '../../domain/SchemaType'
import { DBName } from '../../domain/Schema'
import { useDB } from '@vlcn.io/react'
import { mutations } from '../../domain/mutations'
import { ID_of } from '@vlcn.io/id'

export interface IssueBoardProps {
  issues: readonly Issue[]
}

interface MovedIssues {
  [id: string]: {
    status?: StatusType
    kanbanorder?: string
  }
}

export default function IssueBoard({ issues }: IssueBoardProps) {
  const ctx = useDB(DBName)
  const [movedIssues, setMovedIssues] = useState<MovedIssues>({})

  // Issues are coming from a live query, this may not have updated before we rerender
  // after a drag and drop. So we keep track of moved issues and use that to override
  // the status of the issue when sorting the issues into columns.

  useEffect(() => {
    // Reset moved issues when issues change
    setMovedIssues({})
  }, [issues])

  const { issuesByStatus } = useMemo(() => {
    const issuesByStatus: Partial<Record<StatusType, Issue[]>> = {}
    issues.forEach((issue) => {
      // If the issue has been moved, patch with new status and kanbanorder for sorting
      if (movedIssues[issue.id]) {
        issue = {
          ...issue,
          ...movedIssues[issue.id],
        }
      }
      const status = issue.status
      if (!issuesByStatus[status]) {
        issuesByStatus[status] = []
      }
      issuesByStatus[status]!.push(issue)
    })

    // Sort issues in each column by kanbanorder and issue id
    Object.keys(issuesByStatus).forEach((status) => {
      issuesByStatus[status as StatusType]!.sort((a, b) => {
        if (a.kanbanorder < b.kanbanorder) {
          return -1
        }
        if (a.kanbanorder > b.kanbanorder) {
          return 1
        }
        // Use unique issue id to break ties
        if (a.id < b.id) {
          return -1
        } else {
          return 1
        }
      })
    })

    return { issuesByStatus }
  }, [issues, movedIssues])

  const adjacentIssues = (column: StatusType, index: number, sameColumn = true, currentIndex: number) => {
    const columnIssues = issuesByStatus[column] || []
    let prevIssue: Issue | undefined
    let nextIssue: Issue | undefined
    if (sameColumn) {
      if (currentIndex < index) {
        prevIssue = columnIssues[index]
        nextIssue = columnIssues[index + 1]
      } else {
        prevIssue = columnIssues[index - 1]
        nextIssue = columnIssues[index]
      }
    } else {
      prevIssue = columnIssues[index - 1]
      nextIssue = columnIssues[index]
    }
    return { prevIssue, nextIssue }
  }

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (destination && destination.droppableId) {
      const { prevIssue } = adjacentIssues(
        destination.droppableId as StatusType,
        destination.index,
        destination.droppableId === source.droppableId,
        source.index,
      )

      setMovedIssues((prev) => ({
        ...prev,
        [draggableId]: {
          status: destination.droppableId as StatusType,
        },
      }))

      // Update the issue in the database
      if (prevIssue) {
        mutations.moveIssue(ctx.db, draggableId as ID_of<Issue>, prevIssue.id, destination.droppableId as StatusType);
      } else {
        mutations.updateIssue(ctx.db, {
          id: draggableId as ID_of<Issue>,
          status: destination.droppableId as StatusType,
        })
      }
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-1 pt-6 pl-8 overflow-scroll bg-gray-100">
        <IssueCol
          title={StatusDisplay[Status.BACKLOG]}
          status={Status.BACKLOG}
          issues={issuesByStatus[Status.BACKLOG]}
        />
        <IssueCol title={StatusDisplay[Status.TODO]} status={Status.TODO} issues={issuesByStatus[Status.TODO]} />
        <IssueCol
          title={StatusDisplay[Status.IN_PROGRESS]}
          status={Status.IN_PROGRESS}
          issues={issuesByStatus[Status.IN_PROGRESS]}
        />
        <IssueCol title={StatusDisplay[Status.DONE]} status={Status.DONE} issues={issuesByStatus[Status.DONE]} />
        <IssueCol
          title={StatusDisplay[Status.CANCELED]}
          status={Status.CANCELED}
          issues={issuesByStatus[Status.CANCELED]}
        />
      </div>
    </DragDropContext>
  )
}
