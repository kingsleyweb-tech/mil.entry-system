import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  ShieldCheck,
  User,
  Award,
  Building,
  Phone,
  Mail,
  Calendar,
  Home,
  QrCode,
  FileText,
  Shield,
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

  // Format date like: 24 May 2026, 10:45 AM
  const formatSuccessDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      const day = date.getDate()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      
      let hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12 // Hour '0' -> '12'
      
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
    } catch {
      return dateStr
    }
  }

  const PageHeader = () => (
    <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
      <img src={gafLogo} alt="GAF Logo" className="w-12 h-12 object-contain pointer-events-none animate-fade-in" />
      <div>
        <span className="block text-[9px] tracking-[0.25em] font-black text-emerald-600 uppercase leading-none">
          Ghana Armed Forces
        </span>
        <h1 className="text-slate-800 font-extrabold text-sm sm:text-base mt-1 uppercase tracking-wide leading-tight">
          Exercise Resolute Synergy 2026
        </h1>
        <span className="block text-[10px] italic text-emerald-600 font-semibold mt-0.5">
          "Enhancing Preparedness Through Joint Training"
        </span>
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 font-sans">
        <PageHeader />
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-sm p-8 text-center mx-auto my-auto relative overflow-hidden">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center border-4 border-red-100/50 mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Not Found</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{error}</p>
          <button 
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs" 
            onClick={() => navigate('/register')}
          >
            <ShieldCheck size={16} /> Back to Registration
          </button>
        </div>
        <footer className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10">
          <div>EXERCISE RESOLUTE SYNERGY 2026 &mdash; Ghana Armed Forces</div>
          <div className="text-[9px] text-slate-400 font-medium normal-case tracking-normal mt-2">
            Powered by{' '}
            <a
              href="https://kingdev-aa.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline transition duration-150"
            >
              KingsleyDev
            </a>
          </div>
        </footer>
      </div>
    )
  }

  if (!personnel || !qrDataUrl) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 font-sans">
        <PageHeader />
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-sm p-10 text-center mx-auto my-auto relative overflow-hidden">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-slate-600 font-bold">Generating Pass Details</p>
          <p className="text-xs text-slate-400 mt-1">Acquiring security clearance data…</p>
        </div>
        <footer className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10">
          <div>EXERCISE RESOLUTE SYNERGY 2026 &mdash; Ghana Armed Forces</div>
          <div className="text-[9px] text-slate-400 font-medium normal-case tracking-normal mt-2">
            Powered by{' '}
            <a
              href="https://kingdev-aa.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline transition duration-150"
            >
              KingsleyDev
            </a>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 font-sans print:bg-white print:py-0">
      
      {/* GAF Header block */}
      <div className="print:hidden">
        <PageHeader />
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-10 mx-auto mt-6 print:border-none print:shadow-none print:p-0 print:mt-0">
        
        {/* Centered Checkmark Badge */}
        <div className="flex flex-col items-center text-center mb-8 print:hidden">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 border-4 border-green-100/50 mb-3.5">
            <CheckCircle2 size={28} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Registration Successful!
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md">
            Your registration was completed successfully. Please present your QR code at the entrance for verification.
          </p>
        </div>

        {/* Dynamic content columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 border-t border-slate-100 pt-8 print:border-none print:pt-0">
          
          {/* Details Column */}
          <div className="md:col-span-7 space-y-6 print:w-full">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              <User size={16} className="text-slate-400" />
              Registration Details
            </div>
            
            <div className="space-y-4">
              <DetailRow icon={<User size={15} />} label="Full Name" value={personnel.fullName} />
              <DetailRow icon={<Award size={15} />} label="Service Number" value={personnel.serviceNumber} />
              {personnel.exerciseStatus && (
                <DetailRow icon={<ShieldCheck size={15} />} label="Status" value={personnel.exerciseStatus} />
              )}
              {personnel.armOfService && (
                <DetailRow icon={<Shield size={15} />} label="Arm of Service" value={personnel.armOfService} />
              )}
              {personnel.rank && (
                <DetailRow icon={<Award size={15} />} label="Rank" value={personnel.rank} />
              )}
              <DetailRow icon={<Building size={15} />} label="Unit / Department" value={personnel.unit} />
              <DetailRow icon={<Phone size={15} />} label="Phone Number" value={personnel.phone} />
              <DetailRow icon={<Mail size={15} />} label="Email Address" value={personnel.email} />
              {personnel.appointment && (
                <DetailRow icon={<User size={15} />} label="Appointment / Position" value={personnel.appointment} />
              )}
              
              {/* Registration ID Row (Grey highlighted box) */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50/50 text-sm">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <FileText size={15} className="text-slate-400" />
                  <span>Registration ID</span>
                </div>
                <code className="bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-800 font-bold leading-none tracking-wide">
                  {personnel.registrationId}
                </code>
              </div>

              {/* Status Row (Green pill) */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50/50 text-sm">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <ShieldCheck size={15} className="text-slate-400" />
                  <span>Status</span>
                </div>
                <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full leading-none">
                  <span className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                  {personnel.status}
                </span>
              </div>

              <DetailRow icon={<Calendar size={15} />} label="Registered At" value={formatSuccessDate(personnel.registeredAt)} />
            </div>
          </div>

          {/* QR Code Column */}
          <div className="md:col-span-5 flex flex-col items-center print:w-full print:mt-6">
            <div className="w-full flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 print:hidden">
              <QrCode size={16} className="text-slate-400" />
              Your QR Code
            </div>

            {/* Print Pass Card */}
            <div className="w-full flex flex-col items-center">
              <div className="w-60 h-60 border border-slate-100 bg-slate-50 rounded-2xl p-4 flex items-center justify-center shadow-inner mb-4">
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${personnel.registrationId}`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Entry Clear Notification */}
              <div className="w-full max-w-[280px] bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-600 mb-6 font-medium leading-normal print:hidden">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p>Present this QR code at the entrance for verification and entry.</p>
              </div>

              {/* Stack Actions */}
              <div className="w-full max-w-[280px] flex flex-col gap-2 print:hidden">
                <button
                  className="w-full bg-[#14532d] hover:bg-[#114023] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm shadow-[#14532d]/10"
                  type="button"
                  onClick={download}
                  disabled={!qrDataUrl}
                >
                  <Download size={15} /> Download QR Code
                </button>
                <button
                  className="w-full bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm"
                  type="button"
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> Print QR Code
                </button>
                <button
                  className="w-full bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm"
                  type="button"
                  onClick={() => navigate('/register')}
                >
                  <Home size={15} /> Return Home
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Notice Banner */}
      <div className="w-full max-w-4xl bg-slate-50 border border-slate-100 rounded-2xl p-5 mx-auto mt-6 flex items-start gap-3.5 print:hidden">
        <div className="bg-[#0f2d1d] text-emerald-400 p-2 rounded-xl shadow-inner shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Important Notice</h4>
          <p className="text-[11px] text-slate-500 leading-normal font-medium max-w-xl">
            This QR code is unique to you and should not be shared with others. You can only use this QR code once for entry.
          </p>
        </div>
      </div>

      {/* Page Footer copyright */}
      <div className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-10 space-y-1 print:hidden">
        <div>Exercise Resolute Synergy 2026</div>
        <div className="text-[8px] text-slate-300">Prepared. Committed. Resolute.</div>
        <div className="text-[9px] text-slate-400 font-medium normal-case tracking-normal mt-2">
          Powered by{' '}
          <a
            href="https://kingdev-aa.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-semibold underline transition duration-150"
          >
            KingsleyDev
          </a>
        </div>
      </div>

    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50/50 text-sm">
      <div className="flex items-center gap-3 text-slate-500 font-medium">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-slate-900 font-semibold text-right max-w-[240px] truncate leading-none">
        {value || '—'}
      </span>
    </div>
  )
}
