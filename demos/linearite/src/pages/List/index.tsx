import TopFilter from '../../components/TopFilter'
import IssueList from './IssueList'
import { useDB, useQuery2 } from '@vlcn.io/react'
import { queries } from '../../domain/queries'
import { DBName } from '../../domain/Schema'
import { useFilterState } from '../../hooks/useFilterState'

function List({ showSearch = false }) {
  const ctx = useDB(DBName)
  const [filterState] = useFilterState()
  const issues = useQuery2(ctx, queries.listIssues(filterState)).data ?? []

  return (
    <div className="flex flex-col flex-grow">
      <TopFilter issues={issues} showSearch={showSearch} />
      <IssueList issues={issues} />
    </div>
  )
}

export default List
