import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
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
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import { getPersonnel, checkInPersonnel, subscribeToEntryControl } from '../services/firebase'
import type { Personnel, EntryControlSettings } from '../types/personnel'
import gafLogo from '../assets/gaf.png'

export function RegistrationConfirmedPage() {
  const { registrationId = '' } = useParams()
  const navigate = useNavigate()
  
  // Data states
  const [personnel, setPersonnel] = useState<Personnel>()
  const [entryControl, setEntryControl] = useState<EntryControlSettings | null>(null)
  
  // Loading & status states
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // 1. Load personnel details
  useEffect(() => {
    async function loadDetails() {
      if (!registrationId) return
      setLoading(true)
      setError('')
      try {
        const response = await getPersonnel(registrationId)
        setPersonnel(response.personnel)

        if (response.personnel.status === 'REJECTED') {
          setError('This personnel has been REJECTED and is NOT authorized for entry.')
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to verify registration.')
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [registrationId])

  // 2. Set up real-time listener for Entry Control Settings
  useEffect(() => {
    const unsubscribe = subscribeToEntryControl((settings) => {
      setEntryControl(settings)
    })
    return () => unsubscribe()
  }, [])

  // 3. Confirm Check-In Action
  const handleConfirmCheckIn = async () => {
    if (!registrationId || confirming) return
    setConfirming(true)
    setError('')
    setStatusMessage('')
    try {
      const response = await checkInPersonnel(registrationId, personnel)
      setPersonnel(response.personnel)
      setStatusMessage('Entry has been successfully recorded in the database.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm entry.')
    } finally {
      setConfirming(false)
    }
  }

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Spinning emblem container */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 border-4 border-t-emerald-500 border-r-emerald-500/30 border-b-emerald-500/10 border-l-emerald-500/50 rounded-full animate-spin [animation-duration:1s]" />
          <div className="absolute w-24 h-24 border border-slate-800 rounded-full" />
          <img 
            src={gafLogo} 
            alt="GAF Emblem" 
            className="w-14 h-14 object-contain relative z-10 animate-pulse [animation-duration:2s]" 
          />
        </div>

        {/* Text descriptions */}
        <div className="text-center z-10">
          <span className="text-[10px] tracking-[0.3em] font-black text-emerald-400 uppercase block leading-none animate-pulse">
            Security Checkpoint
          </span>
          <h2 className="text-white font-extrabold text-sm sm:text-base mt-3.5 uppercase tracking-wider">
            {confirming ? 'Recording entry...' : 'Verifying credentials...'}
          </h2>
          <p className="text-slate-400 text-[10px] italic mt-1.5 font-semibold">
            "Enhancing Preparedness Through Joint Training"
          </p>
        </div>
      </div>
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

  const isEntered = personnel?.status === 'ENTERED'
  const isEnabled = entryControl?.entryEnabled === true

  return (
    <PageShell>
      {/* ── Status Banner Indicators ── */}
      <div className="w-full max-w-sm mb-6">
        {isEntered ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wide">⚠️ ALREADY ENTERED</h4>
              <p className="text-[10px] text-amber-700/90 leading-relaxed font-semibold mt-0.5">
                This registration has already been used for entry. Duplicate check-ins are restricted.
              </p>
            </div>
          </div>
        ) : !isEnabled ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wide">🔴 ENTRY VERIFICATION DISABLED</h4>
              <p className="text-[10px] text-red-700/90 leading-relaxed font-semibold mt-0.5">
                Entry verification is currently unavailable. Please contact the administrator.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wide">🟢 ENTRY VERIFICATION ACTIVE</h4>
              <p className="text-[10px] text-emerald-700/90 leading-relaxed font-semibold mt-0.5">
                Personnel verification is currently open. Ready to confirm gate check-in.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Big Status Icon + Headline ── */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
          <div className={`absolute inset-0 rounded-full border-2 scale-[1.4] opacity-50 ${
            isEntered ? 'border-amber-200' : isEnabled ? 'border-emerald-200' : 'border-red-200'
          }`} />
          <div className={`absolute inset-0 rounded-full border scale-[1.7] opacity-30 ${
            isEntered ? 'border-amber-100' : isEnabled ? 'border-emerald-100' : 'border-red-100'
          }`} />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${
            isEntered ? 'bg-amber-500 shadow-amber-200 text-white' : isEnabled ? 'bg-emerald-500 shadow-emerald-200 text-white' : 'bg-red-500 shadow-red-200 text-white'
          }`}>
            {isEntered ? <ShieldAlert size={32} /> : isEnabled ? <CheckCircle2 size={32} className="stroke-[2.5]" /> : <AlertTriangle size={32} />}
          </div>
        </div>

        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
          isEntered ? 'text-amber-600' : isEnabled ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {isEntered ? 'Already Checked In' : isEnabled ? 'Ready for Entry' : 'Verification Locked'}
        </h2>
        
        {statusMessage && (
          <span className="mt-2.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            ✔ {statusMessage}
          </span>
        )}
      </div>

      {/* ── Registration Details Card ── */}
      {personnel && (
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
            <User size={15} className="text-slate-400" />
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
              Personnel Details
            </span>
          </div>

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
              <ConfirmRow icon={<Briefcase size={14} />} label="Appointment" value={personnel.appointment} bold />
            )}
            <ConfirmRow icon={<Calendar size={14} />} label="Date Registered" value={formatDate(personnel.registeredAt)} />
            
            {/* Show Check-in Time if they already entered */}
            {personnel.enteredAt && (
              <ConfirmRow icon={<Calendar size={14} />} label="Entry Time" value={formatDate(personnel.enteredAt)} bold />
            )}

            <div className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                <Hash size={14} className="text-slate-400 shrink-0" />
                <span>Registration ID</span>
              </div>
              <code className="text-emerald-600 font-extrabold tracking-wider text-xs">
                {personnel.registrationId}
              </code>
            </div>
            
            <div className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                <span>Status</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 font-black text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                isEntered 
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isEntered ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                {personnel.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Entry Button (Enforce settings check) ── */}
      {personnel && !isEntered && isEnabled && (
        <button
          onClick={handleConfirmCheckIn}
          disabled={confirming}
          className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-md shadow-emerald-600/10 mb-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? (
            <>
              <Loader2 className="animate-spin" size={15} /> Recording entry...
            </>
          ) : (
            <>
              <ShieldCheck size={15} /> Confirm Entry
            </>
          )}
        </button>
      )}

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

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col py-10 px-4">
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
      <main className="flex flex-col items-center w-full">{children}</main>
      <footer className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-10">
        Exercise Resolute Synergy 2026 &mdash; Ghana Armed Forces Entry Control System
      </footer>
    </div>
  )
}

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
