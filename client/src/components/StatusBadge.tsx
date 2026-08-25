import type { PersonnelStatus } from '../types/personnel'
import { statusTone } from '../utils/format'

export function StatusBadge({ status }: { status: PersonnelStatus }) {
  const displayStatus = status === 'REGISTERED' ? 'YET TO CONFIRM ENTRY' : status
  return <span className={`status-badge ${statusTone(status)}`}>{displayStatus}</span>
}
