import { Portal } from '../Portal'
import { ReactNode, useState } from 'react'
import { ContextMenuTrigger } from '@firefox-devtools/react-contextmenu'
import { Menu } from './menu'
import { PriorityOptions } from '../../types/issue'
import { PriorityType } from '../../domain/SchemaType'

interface Props {
  id: string
  button: ReactNode
  filterKeyword: boolean
  className?: string
  onSelect?: (item: PriorityType) => void
}

function PriorityMenu({ id, button, filterKeyword, className, onSelect }: Props) {
  const [keyword, setKeyword] = useState('')

  const handleSelect = (priority: PriorityType) => {
    setKeyword('')
    if (onSelect) onSelect(priority)
  }
  let statusOpts = PriorityOptions
  if (keyword !== '') {
    const normalizedKeyword = keyword.toLowerCase().trim()
    statusOpts = statusOpts.filter(
      ([_Icon, _priority, label]) => (label as string).toLowerCase().indexOf(normalizedKeyword) !== -1,
    )
  }

  const options = statusOpts.map(([Icon, priority, label], idx) => {
    return (
      <Menu.Item key={`priority-${idx}`} onClick={() => handleSelect(priority)}>
        <Icon className="mr-3" /> <span>{label}</span>
      </Menu.Item>
    )
  })

  return (
    <>
      <ContextMenuTrigger id={id} holdToDisplay={1}>
        {button}
      </ContextMenuTrigger>

      <Portal>
        <Menu
          id={id}
          size="small"
          filterKeyword={filterKeyword}
          searchPlaceholder="Set priority..."
          onKeywordChange={(kw) => setKeyword(kw)}
          className={className}
        >
          {options}
        </Menu>
      </Portal>
    </>
  )
}

PriorityMenu.defaultProps = {
  filterKeyword: false,
}

export default PriorityMenu
