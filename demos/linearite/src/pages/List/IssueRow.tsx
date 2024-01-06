import type { CSSProperties } from "react";
import PriorityMenu from "../../components/contextmenu/PriorityMenu";
import StatusMenu from "../../components/contextmenu/StatusMenu";
import PriorityIcon from "../../components/PriorityIcon";
import StatusIcon from "../../components/StatusIcon";
import Avatar from "../../components/Avatar";
import { memo } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/date";
import { Issue, PriorityType, StatusType } from "../../domain/SchemaType";
import { mutations } from "../../domain/mutations";
import shallowEqual from "../../utils/shallowEqual";

interface Props {
  issue: Issue;
  style: CSSProperties;
}

// eslint-disable-next-line react-refresh/only-export-components
function IssueRow({ issue, style }: Props) {
  const navigate = useNavigate();
  const match = useMatch("issue/:id");

  const handleChangeStatus = (status: StatusType) =>
    mutations.putIssue({
      ...issue,
      status,
    });

  const handleChangePriority = (priority: PriorityType) =>
    mutations.putIssue({
      ...issue,
      priority,
    });

  return (
    <div
      key={issue.id}
      className={
        "flex items-center flex-grow w-full min-w-0 pl-2 pr-8 text-sm cursor-pointer border-b border-gray-100 hover:bg-gray-100 h-11 shrink-0" +
        (match?.params.id == issue.id.toString() ? " bg-gray-100" : "")
      }
      id={issue.id.toString()}
      onClick={() => navigate(`/issue/${issue.id}`)}
      style={style}
    >
      <div className="flex-shrink-0 ml-4">
        <PriorityMenu
          id={"r-priority-" + issue.id}
          button={<PriorityIcon priority={issue.priority} />}
          onSelect={handleChangePriority}
        />
      </div>
      <div className="flex-shrink-0 ml-3">
        <StatusMenu
          id={"r-status-" + issue.id}
          button={<StatusIcon status={issue.status} />}
          onSelect={handleChangeStatus}
        />
      </div>
      <div className="flex-wrap flex-shrink ml-3 overflow-hidden font-medium line-clamp-1 overflow-ellipsis">
        {issue.title.slice(0, 3000) || ""}
      </div>
      <div className="flex-shrink-0 hidden w-15 ml-auto font-normal text-gray-500 sm:block whitespace-nowrap">
        {formatDate(new Date(issue.created))}
      </div>
      <div className="flex-shrink-0 hidden ml-4 font-normal text-gray-500 sm:block w-15 md:block">
        <Avatar name={issue.creator} />
      </div>
    </div>
  );
}

const memoed = memo(IssueRow, (prev, next) => {
  if (prev.issue !== next.issue) {
    return false;
  }
  if (!shallowEqual(prev.style, next.style)) {
    return false;
  }
  return true;
});
export default memoed;
