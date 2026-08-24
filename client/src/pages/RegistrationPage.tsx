import { useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  FileText, 
  ChevronsUp, 
  Building, 
  Phone, 
  Mail, 
  Briefcase, 
  Edit3, 
  Send, 
  ShieldCheck, 
  Lock, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { registerPersonnel } from '../services/firebase'
import type { PersonnelForm } from '../types/personnel'
import gafLogo from '../assets/gaf.png'

const initialForm: PersonnelForm = {
  fullName: '',
  serviceNumber: '',
  rank: '',
  unit: '',
  gender: '',
  phone: '',
  email: '',
  appointment: '',
  notes: '',
}

type Errors = Partial<Record<keyof PersonnelForm, string>>

function validate(form: PersonnelForm) {
  const errors: Errors = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!form.serviceNumber.trim()) errors.serviceNumber = 'Service number is required.'
  if (!form.rank.trim()) errors.rank = 'Rank is required.'
  if (!form.unit.trim()) errors.unit = 'Unit or department is required.'
  if (!form.gender.trim()) errors.gender = 'Gender is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!/^[+()\d\s-]{7,20}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  return errors
}

// Predefined GAF Ranks
const ranks = [
  'General',
  'Lieutenant General',
  'Major General',
  'Brigadier General',
  'Colonel',
  'Lieutenant Colonel',
  'Major',
  'Captain',
  'Lieutenant',
  'Second Lieutenant',
  'Warrant Officer Class I',
  'Warrant Officer Class II',
  'Staff Sergeant',
  'Sergeant',
  'Corporal',
  'Lance Corporal',
  'Private / Recruit',
  'Civilian',
]

// Predefined GAF Units
const units = [
  'General Headquarters (GHQ)',
  'Army Headquarters',
  'Navy Headquarters',
  'Air Force Headquarters',
  'Operations Directorate',
  'Training Directorate',
  '1 Infantry Battalion',
  '2 Infantry Battalion',
  '3 Infantry Battalion',
  '4 Infantry Battalion',
  '5 Infantry Battalion',
  '6 Infantry Battalion',
  'Signals Brigade',
  'Support Services Brigade',
  'Military Academy and Training School (MATS)',
  'Recruit Training School',
]

export function RegistrationPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const navigate = useNavigate()

  const updateField = (field: keyof PersonnelForm, value: string) => {
    setForm((c) => ({ ...c, [field]: value }))
    setErrors((c) => ({ ...c, [field]: undefined }))
    setGlobalError('')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    setGlobalError('')
    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    try {
      const { personnel } = await registerPersonnel(form)
      navigate(`/registration-success/${personnel.registrationId}`)
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between py-10 px-4">
      
      {/* ── Header ── */}
      <header className="flex flex-col items-center text-center">
        <img src={gafLogo} alt="GAF Logo" className="w-16 h-16 object-contain pointer-events-none" />
        <div className="mt-3">
          <span className="text-[10px] tracking-[0.25em] font-black text-slate-400 uppercase block leading-none">
            Exercise
          </span>
          <h1 className="text-slate-800 font-black text-xl sm:text-2xl mt-1 uppercase tracking-wide leading-tight">
            Resolute Synergy 2026
          </h1>
          <span className="text-[9px] tracking-[0.2em] font-bold text-slate-400 uppercase block mt-1">
            Personnel Registration
          </span>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 mx-auto mt-6">
        
        {/* Form Title & Description */}
        <div className="text-center mb-8">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Registration Form
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">
            Please fill in the form below to complete your registration.
          </p>
        </div>

        {/* Global error banner */}
        {globalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-xs font-semibold leading-normal animate-shake">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p>{globalError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} noValidate className="space-y-4">
          
          {/* Full Name Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-1 transition duration-200 ${
                  errors.fullName ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              />
            </div>
            {errors.fullName && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.fullName}</span>}
          </div>

          {/* Service Number Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="serviceNumber" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Service Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileText size={16} />
              </div>
              <input
                id="serviceNumber"
                type="text"
                placeholder="Enter your service number"
                value={form.serviceNumber}
                onChange={(e) => updateField('serviceNumber', e.target.value.toUpperCase())}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-1 transition duration-200 ${
                  errors.serviceNumber ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              />
            </div>
            {errors.serviceNumber && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.serviceNumber}</span>}
          </div>

          {/* Rank Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rank" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Rank <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ChevronsUp size={16} />
              </div>
              <select
                id="rank"
                value={form.rank}
                onChange={(e) => updateField('rank', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${
                  errors.rank ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              >
                <option value="">Select your rank</option>
                {ranks.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.rank && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.rank}</span>}
          </div>

          {/* Unit / Department Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="unit" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Unit / Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building size={16} />
              </div>
              <select
                id="unit"
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${
                  errors.unit ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              >
                <option value="">Select your unit / department</option>
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.unit && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.unit}</span>}
          </div>

          {/* Gender Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gender" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${
                  errors.gender ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.gender && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.gender}</span>}
          </div>

          {/* Phone Number Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone size={16} />
              </div>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 024 123 4567"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-1 transition duration-200 ${
                  errors.phone ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              />
            </div>
            {errors.phone && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.phone}</span>}
          </div>

          {/* Email Address Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                id="email"
                type="email"
                placeholder="e.g. name@domain.mil.gh"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-1 transition duration-200 ${
                  errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              />
            </div>
            {errors.email && <span className="text-red-500 text-[10px] font-bold mt-0.5">{errors.email}</span>}
          </div>

          {/* Appointment / Position Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="appointment" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Appointment / Position <span className="text-slate-400 text-[10px] font-medium">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Briefcase size={16} />
              </div>
              <input
                id="appointment"
                type="text"
                placeholder="Enter your appointment or position"
                value={form.appointment}
                onChange={(e) => updateField('appointment', e.target.value)}
                disabled={submitting}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition duration-200"
              />
            </div>
          </div>

          {/* Additional Notes Textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-slate-700 text-xs font-bold flex items-center gap-1">
              Additional Notes <span className="text-slate-400 text-[10px] font-medium">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-slate-400">
                <Edit3 size={16} />
              </div>
              <textarea
                id="notes"
                placeholder="Any additional information..."
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                disabled={submitting}
                rows={3}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition duration-200 resize-none"
              />
            </div>
          </div>

          {/* Important Warning notice card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3.5 mt-6">
            <div className="bg-[#0f2d1d] text-emerald-400 p-2 rounded-xl shadow-inner shrink-0 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-0.5">Important</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold max-w-sm">
                Ensure all information provided is accurate. Incorrect information may affect your verification and SMS delivery at the entrance.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1b4332] hover:bg-[#143224] active:scale-[0.99] text-white font-extrabold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm shadow-[#1b4332]/10 uppercase tracking-wider"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  Submitting…
                </>
              ) : (
                <>
                  <Send size={14} className="-rotate-12" />
                  Submit Registration
                </>
              )}
            </button>

            {/* Lock Secure note */}
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] mt-4 font-bold tracking-wide">
              <Lock size={12} className="text-slate-300" />
              Your information is secure and protected.
            </div>
          </div>

        </form>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-10">
        Exercise Resolute Synergy 2026 &mdash; Ghana Armed Forces
      </footer>

    </div>
  )
}
