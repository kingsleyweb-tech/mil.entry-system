export function formatDate(value?: string) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function statusTone(status: string) {
  if (status === 'ENTERED') return 'status-green'
  if (status === 'REJECTED') return 'status-red'
  if (status === 'APPROVED') return 'status-blue'
  return 'status-amber'
}
