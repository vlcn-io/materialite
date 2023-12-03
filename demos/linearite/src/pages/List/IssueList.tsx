import { FixedSizeList as List, areEqual } from 'react-window'
import { memo, type CSSProperties } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import IssueRow from './IssueRow'
import { Issue } from '../../domain/SchemaType'

export interface IssueListProps {
  issues: readonly Issue[]
}

function IssueList({ issues }: IssueListProps) {
  return (
    <div className="grow">
      <AutoSizer>
        {({ height, width }: { width: number; height: number }) => (
          <List height={height} itemCount={issues.length} itemSize={36} itemData={issues as Issue[]} width={width}>
            {VirtualIssueRow}
          </List>
        )}
      </AutoSizer>
    </div>
  )
}

const VirtualIssueRow = memo(
  ({ data: issues, index, style }: { data: Issue[]; index: number; style: CSSProperties }) => {
    const issue = issues[index]
    return <IssueRow key={`issue-${issue.id}`} issue={issue} style={style} />
  },
  areEqual,
)

export default IssueList
