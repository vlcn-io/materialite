import classNames from 'classnames'
import { PriorityIcons } from '../types/issue'
import { PriorityType } from '../domain/SchemaType'

interface Props {
  priority: PriorityType
  className?: string
}

export default function PriorityIcon({ priority, className }: Props) {
  const classes = classNames('w-4 h-4', className)
  const Icon = PriorityIcons[priority]
  return <Icon className={classes} />
}
