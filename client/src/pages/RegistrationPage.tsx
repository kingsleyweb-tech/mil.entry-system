import { useState, useEffect } from 'react'
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
  Send,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Loader2,
  Anchor,
  Wind,
} from 'lucide-react'
import { registerPersonnel } from '../services/firebase'
import type { PersonnelForm } from '../types/personnel'
import gafLogo from '../assets/gaf.png'

// ── Rank definitions per arm ─────────────────────────────────────────────────
const RANKS: Record<string, string[]> = {
  Army: [
    // General Officers
    'General of the Army (5-Star)',
    'General',
    'Lieutenant General',
    'Major General',
    'Brigadier General',
    'Brigadier',
    // Field Officers
    'Colonel',
    'Lieutenant Colonel',
    'Major',
    // Junior Officers
    'Captain',
    'Lieutenant',
    'Second Lieutenant',
    // Warrant Officers
    'Regimental Sergeant Major (RSM)',
    'Warrant Officer Class I (WO1)',
    'Warrant Officer Class II (WO2)',
    // Non-Commissioned Officers
    'Staff Sergeant',
    'Sergeant',
    'Corporal',
    'Lance Corporal',
    // Enlisted
    'Private',
    'Recruit',
  ],
  Navy: [
    'Admiral of the Fleet',
    'Admiral',
    'Vice Admiral',
    'Rear Admiral',
    'Commodore',
    'Captain',
    'Commander',
    'Lieutenant Commander',
    'Lieutenant',
    'Sub Lieutenant',
    'Acting Sub Lieutenant',
    'Midshipman',
    'Fleet Chief Petty Officer',
    'Chief Petty Officer',
    'Petty Officer',
    'Leading Seaman',
    'Able Seaman',
    'Ordinary Seaman',
  ],
  'Air Force': [
    'Marshal of the Air Force',
    'Air Chief Marshal',
    'Air Marshal',
    'Air Vice Marshal',
    'Air Commodore',
    'Group Captain',
    'Wing Commander',
    'Squadron Leader',
    'Flight Lieutenant',
    'Flying Officer',
    'Pilot Officer',
    'Acting Pilot Officer',
    'Warrant Officer',
    'Flight Sergeant',
    'Sergeant',
    'Corporal',
    'Lance Corporal',
    'Aircraftman / Aircraftwoman',
  ],
  'General Headquarters': [
    // General Officers
    'General',
    'Lieutenant General',
    'Major General',
    'Brigadier General',
    'Brigadier',
    // Field Officers
    'Colonel',
    'Lieutenant Colonel',
    'Major',
    // Junior Officers
    'Captain',
    'Lieutenant',
    'Second Lieutenant',
    // Warrant Officers
    'Warrant Officer Class I (WO1)',
    'Warrant Officer Class II (WO2)',
    // NCOs
    'Staff Sergeant',
    'Sergeant',
    'Corporal',
    'Lance Corporal',
    'Private',
  ],
}

const ARM_OPTIONS = ['Army', 'Navy', 'Air Force', 'General Headquarters', 'Civilians']

const initialForm: PersonnelForm = {
  fullName: '',
  serviceNumber: '',
  armOfService: '',
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
  if (!form.armOfService.trim()) errors.armOfService = 'Arm of service is required.'
  if (form.armOfService !== 'Civilians' && !form.rank.trim()) errors.rank = 'Rank is required.'
  if (!form.unit.trim()) errors.unit = 'Unit or department is required.'
  if (!form.gender.trim()) errors.gender = 'Gender is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!/^[+()\d\s-]{7,20}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  return errors
}

const ArmIcon = ({ arm }: { arm: string }) => {
  if (arm === 'Navy') return <Anchor size={16} />
  if (arm === 'Air Force') return <Wind size={16} />
  return <ShieldCheck size={16} />
}

const getArmClass = (arm: string, isSelected: boolean) => {
  if (!isSelected) {
    return 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
  }
  switch (arm) {
    case 'Army':
      return 'border-emerald-600 bg-emerald-50 text-emerald-700'
    case 'Navy':
      return 'border-blue-700 bg-blue-50 text-blue-800'
    case 'Air Force':
      return 'border-sky-500 bg-sky-50 text-sky-700'
    case 'General Headquarters':
      return 'border-amber-600 bg-amber-50 text-amber-800'
    case 'Civilians':
    default:
      return 'border-slate-600 bg-slate-100 text-slate-800'
  }
}

const getArmIconClass = (arm: string, isSelected: boolean) => {
  if (!isSelected) return 'text-slate-400'
  switch (arm) {
    case 'Army':
      return 'text-emerald-600'
    case 'Navy':
      return 'text-blue-700'
    case 'Air Force':
      return 'text-sky-500'
    case 'General Headquarters':
      return 'text-amber-600'
    case 'Civilians':
    default:
      return 'text-slate-600'
  }
}

export function RegistrationPage() {
  const [pageLoading, setPageLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 2500) // 2.5s loading screen
    return () => clearTimeout(timer)
  }, [])

  const updateField = (field: keyof PersonnelForm, value: string) => {
    if (field === 'armOfService') {
      // Reset rank when arm changes
      setForm((c) => ({ ...c, armOfService: value, rank: '' }))
    } else {
      setForm((c) => ({ ...c, [field]: value }))
    }
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

  const availableRanks = form.armOfService && form.armOfService !== 'Civilians'
    ? RANKS[form.armOfService] ?? []
    : []

  if (pageLoading || submitting) {
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
          {submitting ? (
            <>
              <span className="text-[10px] tracking-[0.3em] font-black text-emerald-400 uppercase block leading-none animate-pulse">
                Processing
              </span>
              <h2 className="text-white font-extrabold text-sm sm:text-base mt-3.5 uppercase tracking-wider">
                Submitting form...
              </h2>
            </>
          ) : (
            <>
              <span className="text-[10px] tracking-[0.3em] font-black text-emerald-400 uppercase block leading-none">
                GHANA ARMED FORCES
              </span>
              <h2 className="text-white font-extrabold text-sm sm:text-base mt-3.5 uppercase tracking-wider">
                EXERCISE RESOLUTE SYNERGY 2026
              </h2>
              <p className="text-slate-400 text-[10px] italic mt-1.5 font-semibold">
                "Enhancing Preparedness Through Joint Training"
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col py-10 px-4">

      {/* ── Header ── */}
      <header className="flex flex-col items-center text-center mb-8">
        <img src={gafLogo} alt="GAF Logo" className="w-16 h-16 object-contain pointer-events-none" />
        <div className="mt-3">
          <span className="text-[9px] tracking-[0.25em] font-black text-slate-400 uppercase block leading-none">Exercise</span>
          <h1 className="text-slate-800 font-black text-xl sm:text-2xl mt-1 uppercase tracking-wide leading-tight">
            Resolute Synergy 2026
          </h1>
          <span className="text-[9px] tracking-[0.2em] font-bold text-slate-400 uppercase block mt-1">
            Personnel Registration
          </span>
          {/* Theme tagline */}
          <span className="text-[10px] italic text-emerald-600 font-semibold mt-2 block">
            "Enhancing Preparedness Through Joint Training"
          </span>
        </div>
      </header>

      {/* ── Form Container ── */}
      <main className="w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 mx-auto">

        <div className="text-center mb-7">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Registration Form</h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">
            Please fill in the form below to complete your registration.
          </p>
        </div>

        {globalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-xs font-semibold leading-normal">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p>{globalError}</p>
          </div>
        )}

        <form onSubmit={submit} noValidate className="space-y-4">

          {/* Full Name */}
          <FieldWrap label="Full Name" required error={errors.fullName}>
            <InputWithIcon icon={<User size={16} />}
              id="fullName" type="text" placeholder="Enter your full name"
              value={form.fullName} disabled={submitting} hasError={!!errors.fullName}
              onChange={(v) => updateField('fullName', v)} />
          </FieldWrap>

          {/* Service Number */}
          <FieldWrap label="Service Number" required error={errors.serviceNumber}>
            <InputWithIcon icon={<FileText size={16} />}
              id="serviceNumber" type="text" placeholder="Enter your service number"
              value={form.serviceNumber} disabled={submitting} hasError={!!errors.serviceNumber}
              onChange={(v) => updateField('serviceNumber', v.toUpperCase())} />
          </FieldWrap>

          {/* Arm of Service */}
          <FieldWrap label="Arm of Service" required error={errors.armOfService}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {ARM_OPTIONS.map((arm) => (
                <button
                  key={arm}
                  type="button"
                  disabled={submitting}
                  onClick={() => updateField('armOfService', arm)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition duration-150 text-xs font-bold cursor-pointer ${
                    getArmClass(arm, form.armOfService === arm)
                  }`}
                >
                  <span className={getArmIconClass(arm, form.armOfService === arm)}>
                    <ArmIcon arm={arm} />
                  </span>
                  {arm}
                </button>
              ))}
            </div>
            {errors.armOfService && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.armOfService}</p>}
          </FieldWrap>

          {/* Rank — only shown when arm is not Civilian */}
          {form.armOfService && form.armOfService !== 'Civilians' && (
            <FieldWrap label="Rank" required error={errors.rank}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronsUp size={16} />
                </div>
                <select
                  id="rank"
                  value={form.rank}
                  onChange={(e) => updateField('rank', e.target.value)}
                  disabled={submitting}
                  className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-8 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${
                    errors.rank ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                  }`}
                >
                  <option value="">Select your rank ({form.armOfService})</option>
                  {availableRanks.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </FieldWrap>
          )}

          {/* Unit / Department */}
          <FieldWrap label="Unit / Department" required error={errors.unit}>
            <InputWithIcon icon={<Building size={16} />}
              id="unit" type="text" placeholder="Enter your unit / department"
              value={form.unit} disabled={submitting} hasError={!!errors.unit}
              onChange={(v) => updateField('unit', v)} />
          </FieldWrap>

          {/* Gender */}
          <FieldWrap label="Gender" required error={errors.gender}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                disabled={submitting}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-8 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${
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
          </FieldWrap>

          {/* Phone Number */}
          <FieldWrap label="Phone Number" required error={errors.phone}>
            <InputWithIcon icon={<Phone size={16} />}
              id="phone" type="tel" placeholder="e.g. 024 123 4567"
              value={form.phone} disabled={submitting} hasError={!!errors.phone}
              onChange={(v) => updateField('phone', v)} />
          </FieldWrap>

          {/* Email Address */}
          <FieldWrap label="Email Address" required error={errors.email}>
            <InputWithIcon icon={<Mail size={16} />}
              id="email" type="email" placeholder="e.g. name@domain.mil.gh"
              value={form.email} disabled={submitting} hasError={!!errors.email}
              onChange={(v) => updateField('email', v)} />
          </FieldWrap>

          {/* Appointment / Position */}
          <FieldWrap label="Appointment / Position" optional>
            <InputWithIcon icon={<Briefcase size={16} />}
              id="appointment" type="text" placeholder="Enter your appointment or position"
              value={form.appointment} disabled={submitting} hasError={false}
              onChange={(v) => updateField('appointment', v)} />
          </FieldWrap>

          {/* Important notice */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3.5 mt-2">
            <div className="bg-[#0f2d1d] text-emerald-400 p-2 rounded-xl shadow-inner shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-0.5">Important</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold max-w-sm">
                Ensure all information provided is accurate. Incorrect information may affect your verification and SMS delivery at the entrance.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1b4332] hover:bg-[#143224] active:scale-[0.99] text-white font-extrabold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm uppercase tracking-wider"
            >
              {submitting
                ? <><Loader2 className="animate-spin" size={15} />Submitting…</>
                : <><Send size={14} className="-rotate-12" />Submit Registration</>}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] mt-4 font-bold tracking-wide">
              <Lock size={12} className="text-slate-300" />
              Your information is secure and protected.
            </div>
          </div>

        </form>
      </main>

      <footer className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-10">
        Exercise Resolute Synergy 2026 &mdash; Ghana Armed Forces
      </footer>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function FieldWrap({
  label, required, optional, error, children
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-700 text-xs font-bold flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-slate-400 text-[10px] font-medium">(Optional)</span>}
      </label>
      {children}
      {error && <span className="text-red-500 text-[10px] font-bold">{error}</span>}
    </div>
  )
}

function InputWithIcon({
  icon, id, type, placeholder, value, disabled, hasError, onChange
}: {
  icon: React.ReactNode
  id: string
  type: string
  placeholder: string
  value: string
  disabled: boolean
  hasError: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        {icon}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-1 transition duration-200 ${
          hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
        }`}
      />
    </div>
  )
}
