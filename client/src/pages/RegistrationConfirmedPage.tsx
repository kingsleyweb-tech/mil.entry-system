import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  User,
  FileText,
  ChevronsUp,
  Building,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  ShieldCheck,
  Hash,
  Home,
} from 'lucide-react'
import { getPersonnel, checkInPersonnel } from '../services/firebase'
import type { Personnel } from '../types/personnel'
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

        if (response.personnel.status === 'REJECTED') {
          setError('This personnel has been REJECTED and is NOT authorized for entry.')
        } else if (response.personnel.status === 'ENTERED') {
          setStatusMessage('Personnel has already checked in previously.')
        } else {
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      let hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes} ${ampm}`
    } catch { return dateStr }
  }

  // ── Loading ──
  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={38} className="animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 font-bold">Verifying credentials against database…</p>
        </div>
      </PageShell>
    )
  }

  // ── Error / Access Denied ──
  if (error) {
    return (
      <PageShell>
        <div className="flex flex-col items-center text-center py-10 gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-red-600 uppercase tracking-wide">Access Denied</h2>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{error}</p>
          {personnel && (
            <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-left text-xs text-slate-600 space-y-1">
              <p><strong>Name:</strong> {personnel.fullName}</p>
              <p><strong>Service Number:</strong> {personnel.serviceNumber}</p>
              <p><strong>Unit:</strong> {personnel.unit}</p>
            </div>
          )}
          <button
            className="bg-slate-900 text-white text-xs font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition flex items-center gap-2"
            onClick={() => navigate('/register')}
          >
            <Home size={14} /> Back to Portal
          </button>
        </div>
      </PageShell>
    )
  }

  // ── Confirmed ──
  return (
    <PageShell>
      {/* Big checkmark + headline */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          {/* Decorative rings */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-200 scale-[1.4] opacity-50" />
          <div className="absolute inset-0 rounded-full border border-emerald-100 scale-[1.7] opacity-30" />
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-200">
            <CheckCircle2 size={32} className="text-white stroke-[2.5]" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">Registration Confirmed!</h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-sm">
          Your registration was successful and your information has been saved in our database.
        </p>
        <p className="text-slate-400 text-[11px] mt-1 font-semibold">
          Thank you for registering for Exercise Resolute Synergy 2026.
        </p>
        {statusMessage && (
          <span className="mt-2 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            ✔ {statusMessage}
          </span>
        )}
      </div>

      {/* ── Registration Details Card ── */}
      {personnel && (
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Card header */}
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
            <User size={15} className="text-slate-400" />
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
              Your Registration Details
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50 px-5">
            <ConfirmRow icon={<User size={14} />} label="Full Name" value={personnel.fullName} bold />
            <ConfirmRow icon={<FileText size={14} />} label="Service Number" value={personnel.serviceNumber} />
            {personnel.armOfService && (
              <ConfirmRow icon={<ShieldCheck size={14} />} label="Arm of Service" value={personnel.armOfService} />
            )}
            {personnel.rank && (
              <ConfirmRow icon={<ChevronsUp size={14} />} label="Rank" value={personnel.rank} bold />
            )}
            <ConfirmRow icon={<Building size={14} />} label="Unit / Department" value={personnel.unit} bold />
            <ConfirmRow icon={<Phone size={14} />} label="Phone Number" value={personnel.phone} />
            <ConfirmRow icon={<Mail size={14} />} label="Email Address" value={personnel.email} />
            {personnel.appointment && (
              <ConfirmRow icon={<Briefcase size={14} />} label="Appointment / Position" value={personnel.appointment} bold />
            )}
            <ConfirmRow icon={<Calendar size={14} />} label="Date Registered" value={formatDate(personnel.registeredAt)} />
            {/* Registration ID — green highlight */}
            <div className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                <Hash size={14} className="text-slate-400 shrink-0" />
                <span>Registration ID</span>
              </div>
              <code className="text-emerald-600 font-extrabold tracking-wider text-xs">
                {personnel.registrationId}
              </code>
            </div>
            {/* Status — pill */}
            <div className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                <span>Status</span>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {personnel.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── "You are all set!" notice ── */}
      <div className="w-full max-w-sm bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3.5 mb-6">
        <div className="bg-emerald-600 text-white p-2.5 rounded-xl shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 text-xs mb-0.5">You are all set!</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
            Your information has been verified and stored securely.
            You will be notified of any updates regarding the exercise.
          </p>
        </div>
      </div>

      {/* Return home */}
      <button
        onClick={() => navigate('/register')}
        className="w-full max-w-sm bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-sm"
      >
        <Home size={15} /> Return to Home
      </button>

      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-8">
        Discipline. Integrity. Excellence.
      </p>
    </PageShell>
  )
}

// ── Page wrapper with header & footer ────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col py-10 px-4">
      {/* Header */}
      <header className="flex flex-col items-center text-center mb-8">
        <img src={gafLogo} alt="GAF Logo" className="w-14 h-14 object-contain pointer-events-none" />
        <div className="mt-2">
          <span className="block text-[9px] tracking-[0.25em] font-black text-slate-400 uppercase">Exercise</span>
          <h1 className="text-slate-800 font-black text-lg sm:text-xl mt-1 uppercase tracking-wide">Resolute Synergy 2026</h1>
          <span className="block text-[9px] tracking-[0.2em] font-bold text-slate-400 uppercase mt-1">Personnel Registration</span>
          <span className="block text-[10px] italic text-emerald-600 font-semibold mt-1.5">
            "Enhancing Preparedness Through Joint Training"
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center w-full">{children}</main>

      {/* Footer */}
      <footer className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-10">
        Exercise Resolute Synergy 2026 &mdash; Ghana Armed Forces Entry Control System
      </footer>
    </div>
  )
}

// ── Detail row component ──────────────────────────────────────────────────────
function ConfirmRow({
  icon, label, value, bold,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 text-xs">
      <div className="flex items-center gap-2.5 text-slate-500 font-medium">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-right max-w-[180px] leading-tight ${bold ? 'text-slate-900 font-bold' : 'text-slate-700 font-medium'}`}>
        {value || '—'}
      </span>
    </div>
  )
}
