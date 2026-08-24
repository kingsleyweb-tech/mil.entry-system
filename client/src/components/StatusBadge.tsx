import type { PersonnelStatus } from '../types/personnel'
import { statusTone } from '../utils/format'

export function StatusBadge({ status }: { status: PersonnelStatus }) {
  return <span className={`status-badge ${statusTone(status)}`}>{status}</span>
}
