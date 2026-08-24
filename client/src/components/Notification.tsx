import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

type Props = {
  type: 'success' | 'error' | 'warning'
  message: string
  onClose?: () => void
}

export function Notification({ type, message, onClose }: Props) {
  const Icon = type === 'success' ? CheckCircle2 : AlertTriangle
  return (
    <div className={`notice notice-${type}`} role="alert">
      <Icon size={20} aria-hidden="true" />
      <span>{message}</span>
      {onClose ? (
        <button className="icon-button ml-auto" type="button" onClick={onClose} aria-label="Dismiss notification">
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
