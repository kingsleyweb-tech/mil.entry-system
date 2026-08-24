import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { getPersonnel, checkInPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
import { StatusBadge } from '../components/StatusBadge'
import gafLogo from '../assets/gaf.png'

export function RegistrationConfirmedPage() {
  const { registrationId = '' } = useParams()
  const navigate = useNavigate()
  const [personnel, setPersonnel] = useState<Personnel>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    async function confirmEntry() {
      if (!registrationId) return
      setLoading(true)
      setError('')
      try {

        const response = await getPersonnel(registrationId)
        setPersonnel(response.personnel)

        // 2. Perform check-in / status update
        if (response.personnel.status === 'REJECTED') {
          setError('This personnel has been REJECTED and is NOT authorized for entry.')
        } else if (response.personnel.status === 'ENTERED') {
          setStatusMessage('Personnel has already checked in previously.')
        } else {
          // If status is REGISTERED or APPROVED, mark as ENTERED
          const checkInResponse = await checkInPersonnel(registrationId)
          setPersonnel(checkInResponse.personnel)
          setStatusMessage('Entry has been successfully recorded in the database.')
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to verify registration.')
      } finally {
        setLoading(false)
      }
    }
    confirmEntry()
  }, [registrationId])

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="rc-root">
      <header className="rc-header">
        <div className="rc-header-inner">
          <div className="rc-emblem">
            <img src={gafLogo} alt="GAF Logo" className="rc-emblem-img" />
          </div>
          <div>
            <p className="rc-sup">GHANA ARMED FORCES</p>
            <h1 className="rc-title">EXERCISE RESOLUTE SYNERGY 2026</h1>
            <p className="rc-sub">Entrance Verification Portal</p>
          </div>
        </div>
      </header>
      <main className="rc-main">{children}</main>
      <footer className="rc-footer-bar">
        EXERCISE RESOLUTE SYNERGY 2026 &mdash; Ghana Armed Forces Entry Control System
      </footer>
    </div>
  )

  if (loading) {
    return (
      <PageWrapper>
        <div className="rc-center-card">
          <Loader2 size={40} className="animate-spin rc-loader-icon" />
          <p className="rc-loading-text">Verifying credentials against database…</p>
        </div>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="rc-center-card rc-error-card">
          <AlertTriangle size={48} className="rc-err-icon" />
          <h2>ACCESS DENIED</h2>
          <p className="rc-error-msg">{error}</p>
          {personnel && (
            <div className="rc-mini-details">
              <p><strong>Name:</strong> {personnel.fullName}</p>
              <p><strong>Service Number:</strong> {personnel.serviceNumber}</p>
              <p><strong>Unit:</strong> {personnel.unit}</p>
            </div>
          )}
          <button className="rc-btn-black" onClick={() => navigate('/register')}>
            Back to Portal
          </button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* ── Success Card ── */}
      <div className="rc-card">
        <div className="rc-success-header">
          <CheckCircle2 size={54} className="rc-success-icon" />
          <h2 className="rc-success-title">CREDENTIALS VERIFIED</h2>
          <p className="rc-database-confirm">✔ Details are in the database</p>
          <span className="rc-status-banner-text">{statusMessage}</span>
        </div>

        {/* ── User details ── */}
        {personnel && (
          <div className="rc-details-section">
            <h3 className="rc-section-title">Personnel Profile</h3>
            <dl className="rc-dl">
              <Row label="Full Name" value={personnel.fullName} />
              <Row label="Service Number" value={personnel.serviceNumber} />
              <Row label="Rank" value={personnel.rank} />
              <Row label="Gender" value={personnel.gender} />
              <Row label="Unit / Department" value={personnel.unit} />
              {personnel.appointment && <Row label="Appointment" value={personnel.appointment} />}
              <Row label="Phone" value={personnel.phone} />
              <Row label="Email" value={personnel.email} />
              <Row label="Registration ID" value={personnel.registrationId} />
              <div className="rc-row">
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={personnel.status} />
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value?: string
  highlight?: boolean
}) {
  return (
    <div className="rc-row">
      <dt>{label}</dt>
      <dd className={highlight ? 'rc-dd-highlight' : ''}>{value || '—'}</dd>
    </div>
  )
}
