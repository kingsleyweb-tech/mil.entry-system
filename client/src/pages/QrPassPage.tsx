import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  AlertTriangle,
  Download,
  Loader2,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { getPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
import gafLogo from '../assets/gaf.png'
import { getBaseUrl } from '../utils/url'

export function QrPassPage() {
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
        setError(loadError instanceof Error ? loadError.message : 'Unable to load entrance pass.')
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
            <p className="rs-sub">Official Entrance Pass</p>
            <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
              "Enhancing Preparedness Through Joint Training"
            </p>
          </div>
        </div>
      </header>
      <main className="rs-main flex items-center justify-center p-6">{children}</main>
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
          <h2>Entrance Pass Not Found</h2>
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
          <p className="rs-loading-text">Generating your entrance pass, please wait…</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 flex flex-col items-center">
        {/* Pass badge header */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full mb-6">
          Verified Entrance Pass
        </div>

        {/* Dynamic QR Code */}
        <div className="w-64 h-64 border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center justify-center shadow-inner mb-4">
          <img
            src={qrDataUrl}
            alt={`QR code for ${personnel.registrationId}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Unique registration number */}
        <div className="text-center mb-6">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Your Registration Number
          </span>
          <code className="text-xl font-extrabold text-slate-900 tracking-wider">
            {personnel.registrationId}
          </code>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs"
            type="button"
            onClick={download}
            disabled={!qrDataUrl}
          >
            <Download size={15} /> Download QR Pass
          </button>
          <button
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print Pass
          </button>
        </div>

        {/* Security Warning */}
        <p className="text-[10px] text-slate-400 font-bold text-center mt-6 uppercase tracking-wider leading-relaxed">
          ⚠️ Present this pass at the gate. Details will be verified against the official database.
        </p>
      </div>
    </PageWrapper>
  )
}
