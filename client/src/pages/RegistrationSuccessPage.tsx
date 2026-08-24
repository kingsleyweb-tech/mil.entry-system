import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { getPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
import gafLogo from '../assets/gaf.png'
import { getBaseUrl } from '../utils/url'

export function RegistrationSuccessPage() {
  const { registrationId = '' } = useParams()
  const navigate = useNavigate()
  const [personnel, setPersonnel] = useState<Personnel>()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!registrationId) return
      try {
        const response = await getPersonnel(registrationId)
        setPersonnel(response.personnel)
        // Use resolved base URL depending on local/hosted environment
        const baseUrl = getBaseUrl()
        const confirmationUrl = `${baseUrl}/registration-confirmed/${response.personnel.registrationId}`
        const url = await QRCode.toDataURL(confirmationUrl, {
          width: 320,
          margin: 3,
          errorCorrectionLevel: 'H',
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        setQrDataUrl(url)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load registration.')
      }
    }
    load()
  }, [registrationId])

  const download = () => {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${registrationId}-entrance-qr.png`
    link.click()
  }

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="rs-root">
      <header className="rs-header">
        <div className="rs-header-inner">
          <div className="rs-emblem">
            <img src={gafLogo} alt="GAF Logo" className="rs-emblem-img" />
          </div>
          <div>
            <p className="rs-label">GHANA ARMED FORCES</p>
            <h1 className="rs-title">EXERCISE RESOLUTE SYNERGY 2026</h1>
            <p className="rs-sub">Personnel Registration Portal</p>
          </div>
        </div>
      </header>
      <main className="rs-main">{children}</main>
      <footer className="rs-footer-bar">
        EXERCISE RESOLUTE SYNERGY 2026 &mdash; Ghana Armed Forces Entry Control System
      </footer>
    </div>
  )

  if (error) {
    return (
      <PageWrapper>
        <div className="rs-center-card">
          <AlertTriangle size={44} className="rs-err-icon" />
          <h2>Registration Not Found</h2>
          <p>{error}</p>
          <button className="rs-btn-primary" onClick={() => navigate('/register')}>
            <ShieldCheck size={17} /> Back to Registration
          </button>
        </div>
      </PageWrapper>
    )
  }

  if (!personnel || !qrDataUrl) {
    return (
      <PageWrapper>
        <div className="rs-center-card">
          <Loader2 size={38} className="animate-spin rs-loader-icon" />
          <p className="rs-loading-text">Generating your QR code, please wait…</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* ── Success notice ── */}
      <div className="rs-success-notice">
        <CheckCircle2 size={24} className="rs-success-icon" />
        <div>
          <strong>Registration Successful</strong>
          <span>Your details have been saved. Proceed to download or print your QR code.</span>
        </div>
      </div>

      {/* ── ⚠️ Download/Print alert ── */}
      <div className="rs-alert-box">
        <Shield size={20} className="rs-alert-icon" />
        <div>
          <p className="rs-alert-title">Action Required — Download or Print Your QR Code</p>
          <p className="rs-alert-body">
            You <strong>must</strong> present this QR code at the entrance gate to gain access
            to the hall. Without it, entry will be denied. Download or print it now before
            closing this page.
          </p>
        </div>
      </div>

      <div className="rs-content">
        {/* ── Personnel details ── */}
        <div className="rs-details-card">
          <div className="rs-card-head">
            <ShieldCheck size={18} className="rs-card-head-icon" />
            <h2 className="rs-card-title">Personnel Details</h2>
          </div>

          {/* ── Registration Number highlight box ── */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#15803d' }}>Your Registration Number</span>
            <code style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.06em' }}>{personnel.registrationId}</code>
            <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>Keep this number safe — you may be asked to quote it at the gate.</span>
          </div>
          <dl className="rs-dl">
            <Row label="Full Name" value={personnel.fullName} />
            <Row label="Service Number" value={personnel.serviceNumber} />
            <Row label="Rank" value={personnel.rank} />
            <Row label="Gender" value={personnel.gender} />
            <Row label="Unit / Department" value={personnel.unit} />
            {personnel.appointment && <Row label="Appointment" value={personnel.appointment} />}
            <Row label="Phone" value={personnel.phone} />
            <Row label="Email" value={personnel.email} />
            <Row label="Status" value={personnel.status} pill />
          </dl>
        </div>

        {/* ── QR Code panel ── */}
        <div className="rs-qr-panel">
          <p className="rs-qr-label">Your Entrance QR Code</p>

          <div className="rs-qr-img-wrap">
            <img
              src={qrDataUrl}
              alt={`QR code for ${personnel.registrationId}`}
              className="rs-qr-img"
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '3px' }}>Your Registration Number</span>
            <code className="rs-qr-id-text">{personnel.registrationId}</code>
          </div>

          <div className="rs-qr-actions">
            <button
              className="rs-btn-primary"
              type="button"
              onClick={download}
              disabled={!qrDataUrl}
            >
              <Download size={16} /> Download QR Code
            </button>
            <button
              className="rs-btn-secondary"
              type="button"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print
            </button>
          </div>

          <p className="rs-qr-reminder">
            ⚠️ Keep this code safe. It is your only means of entry.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}

function Row({
  label,
  value,
  pill,
}: {
  label: string
  value?: string
  pill?: boolean
}) {
  return (
    <div className="rs-row">
      <dt>{label}</dt>
      <dd>{pill ? <span className="rs-pill">{value || '—'}</span> : (value || '—')}</dd>
    </div>
  )
}
