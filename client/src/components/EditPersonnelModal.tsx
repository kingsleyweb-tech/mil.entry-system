import { useState } from 'react'
import type React from 'react'
import {
  X,
  Loader2,
  User,
  FileText,
  ChevronsUp,
  Building,
  Phone,
  Mail,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Anchor,
  Wind,
  Landmark,
  ShieldCheck,
  Users,
  StickyNote,
} from 'lucide-react'
import { updatePersonnel } from '../services/firebase'
import type { Personnel, PersonnelStatus } from '../types/personnel'



const RANKS: Record<string, string[]> = {
  Army: [
    'General of the Army (5-Star)', 'General', 'Lieutenant General', 'Major General',
    'Brigadier General', 'Brigadier', 'Colonel', 'Lieutenant Colonel', 'Major',
    'Captain', 'Lieutenant', 'Second Lieutenant',
    'Regimental Sergeant Major (RSM)', 'Warrant Officer Class I (WO1)', 'Warrant Officer Class II (WO2)',
    'Staff Sergeant', 'Sergeant', 'Corporal', 'Lance Corporal', 'Private', 'Recruit',
  ],
  Navy: [
    'Admiral of the Fleet', 'Admiral', 'Vice Admiral', 'Rear Admiral', 'Commodore',
    'Captain', 'Commander', 'Lieutenant Commander', 'Lieutenant',
    'Sub Lieutenant', 'Acting Sub Lieutenant', 'Midshipman',
    'Fleet Chief Petty Officer', 'Chief Petty Officer', 'Petty Officer',
    'Leading Seaman', 'Able Seaman', 'Ordinary Seaman',
  ],
  'Air Force': [
    'Marshal of the Air Force', 'Air Chief Marshal', 'Air Marshal', 'Air Vice Marshal',
    'Air Commodore', 'Group Captain', 'Wing Commander', 'Squadron Leader',
    'Flight Lieutenant', 'Flying Officer', 'Pilot Officer', 'Acting Pilot Officer',
    'Warrant Officer', 'Flight Sergeant', 'Sergeant', 'Corporal',
    'Lance Corporal', 'Aircraftman / Aircraftwoman',
  ],
}

const ARM_OPTIONS = ['Army', 'Navy', 'Air Force', 'DCS']
const STATUS_OPTIONS = ['Participants', 'Evaluators', 'General Headquarters', 'Civilians']
const ENTRY_STATUS_OPTIONS: PersonnelStatus[] = ['REGISTERED', 'APPROVED', 'ENTERED', 'REJECTED']

// ── Edit form shape ───────────────────────────────────────────────────────────

type EditForm = {
  fullName: string
  serviceNumber: string   
  armOfService: string
  rank: string
  exerciseStatus: string
  unit: string
  gender: string
  phone: string
  email: string
  appointment: string
  notes: string
  status: PersonnelStatus
}

type EditErrors = Partial<Record<keyof EditForm, string>>

function validate(form: EditForm): EditErrors {
  const e: EditErrors = {}
  if (!form.fullName.trim()) e.fullName = 'Full name is required.'
  if (form.exerciseStatus !== 'Civilians') {
    if (!form.armOfService.trim()) e.armOfService = 'Arm of service is required.'
    if (!form.rank.trim()) e.rank = 'Rank is required.'
  }
  if (!form.exerciseStatus.trim()) e.exerciseStatus = 'Status is required.'
  if (!form.unit.trim()) e.unit = 'Unit or department is required.'
  if (!form.gender.trim()) e.gender = 'Gender is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
  if (!/^[+()\d\s-]{7,20}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number.'
  return e
}


function FieldWrap({ label, required, optional, error, children }: {
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

function InputWithIcon({ icon, id, type, placeholder, value, disabled, hasError, onChange, readOnly }: {
  icon: React.ReactNode
  id: string
  type: string
  placeholder: string
  value: string
  disabled: boolean
  hasError: boolean
  onChange: (v: string) => void
  readOnly?: boolean
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
        readOnly={readOnly}
        className={`w-full border text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-1 transition duration-200 ${
          readOnly
            ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
            : hasError
            ? 'bg-white border-red-300 focus:border-red-400 focus:ring-red-400'
            : 'bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400'
        }`}
      />
    </div>
  )
}

// Arm/Status button helpers (copied from RegistrationPage)
const ArmIcon = ({ arm }: { arm: string }) => {
  if (arm === 'Navy') return <Anchor size={16} />
  if (arm === 'Air Force') return <Wind size={16} />
  if (arm === 'DCS') return <Landmark size={16} />
  return <ShieldCheck size={16} />
}
const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'Participants') return <Users size={16} />
  if (status === 'Evaluators') return <ShieldCheck size={16} />
  if (status === 'General Headquarters') return <Building size={16} />
  return <User size={16} />
}
const getArmClass = (arm: string, sel: boolean) => {
  if (!sel) return 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
  switch (arm) {
    case 'Army': return 'border-emerald-600 bg-emerald-50 text-emerald-700'
    case 'Navy': return 'border-blue-700 bg-blue-50 text-blue-800'
    case 'Air Force': return 'border-sky-500 bg-sky-50 text-sky-700'
    case 'DCS': return 'border-violet-600 bg-violet-50 text-violet-800'
    default: return 'border-slate-600 bg-slate-100 text-slate-800'
  }
}
const getArmIconClass = (arm: string, sel: boolean) => {
  if (!sel) return 'text-slate-400'
  switch (arm) {
    case 'Army': return 'text-emerald-600'
    case 'Navy': return 'text-blue-700'
    case 'Air Force': return 'text-sky-500'
    case 'DCS': return 'text-violet-600'
    default: return 'text-slate-600'
  }
}
const getStatusClass = (status: string, sel: boolean) => {
  if (!sel) return 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
  switch (status) {
    case 'Participants': return 'border-emerald-600 bg-emerald-50 text-emerald-700'
    case 'Evaluators': return 'border-blue-700 bg-blue-50 text-blue-800'
    case 'General Headquarters': return 'border-amber-600 bg-amber-50 text-amber-800'
    default: return 'border-slate-600 bg-slate-100 text-slate-800'
  }
}
const getStatusIconClass = (status: string, sel: boolean) => {
  if (!sel) return 'text-slate-400'
  switch (status) {
    case 'Participants': return 'text-emerald-600'
    case 'Evaluators': return 'text-blue-700'
    case 'General Headquarters': return 'text-amber-600'
    default: return 'text-slate-600'
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export type EditPersonnelModalProps = {
  person: Personnel
  onClose: () => void
  onSaved: (updated: Personnel) => void
}

export function EditPersonnelModal({ person, onClose, onSaved }: EditPersonnelModalProps) {
  const [form, setForm] = useState<EditForm>({
    fullName: person.fullName,
    serviceNumber: person.serviceNumber,
    armOfService: person.armOfService ?? '',
    rank: person.rank,
    exerciseStatus: person.exerciseStatus,
    unit: person.unit,
    gender: person.gender,
    phone: person.phone,
    email: person.email,
    appointment: person.appointment ?? '',
    notes: person.notes ?? '',
    status: person.status,
  })
  const [errors, setErrors] = useState<EditErrors>({})
  const [saving, setSaving] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (field: keyof EditForm, value: string) => {
    if (field === 'exerciseStatus') {
      if (value === 'Civilians') {
        setForm((c) => ({ ...c, exerciseStatus: value, armOfService: '', rank: '' }))
      } else {
        setForm((c) => ({ ...c, exerciseStatus: value }))
      }
    } else if (field === 'armOfService') {
      setForm((c) => ({ ...c, armOfService: value, rank: '' }))
    } else {
      setForm((c) => ({ ...c, [field]: value }))
    }
    setErrors((c) => ({ ...c, [field]: undefined }))
    setGlobalError('')
    setSaved(false)
  }

  const handleSave = async () => {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    setGlobalError('')
    try {
      await updatePersonnel(person.id, {
        fullName: form.fullName.trim(),
        armOfService: form.armOfService.trim(),
        rank: form.rank.trim(),
        exerciseStatus: form.exerciseStatus.trim(),
        unit: form.unit.trim(),
        gender: form.gender.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        appointment: form.appointment.trim(),
        notes: form.notes.trim(),
        status: form.status,
      })
      const updated: Personnel = {
        ...person,
        fullName: form.fullName.trim(),
        armOfService: form.armOfService.trim() || undefined,
        rank: form.rank.trim(),
        exerciseStatus: form.exerciseStatus.trim(),
        unit: form.unit.trim(),
        gender: form.gender.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        appointment: form.appointment.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
      }
      setSaved(true)
      onSaved(updated)
      // Auto-close after showing success for 1.2 seconds
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const availableRanks = form.armOfService && form.exerciseStatus !== 'Civilians'
    ? RANKS[form.armOfService] ?? []
    : []

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl my-8 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div>
            <p className="text-sm font-black text-slate-900 tracking-tight">Edit Personnel Record</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">
              {person.registrationId} · {person.serviceNumber}
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">

          {/* Global error / success */}
          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold leading-normal">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={15} />
              {globalError}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold leading-normal">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={15} />
              Changes saved successfully.
            </div>
          )}

          {/* Service Number — read-only */}
          <FieldWrap label="Service Number">
            <InputWithIcon icon={<FileText size={16} />}
              id="edit-serviceNumber" type="text" placeholder=""
              value={form.serviceNumber} disabled={saving} hasError={false}
              onChange={() => {}} readOnly />
          </FieldWrap>

          {/* Full Name */}
          <FieldWrap label="Full Name" required error={errors.fullName}>
            <InputWithIcon icon={<User size={16} />}
              id="edit-fullName" type="text" placeholder="Enter full name"
              value={form.fullName} disabled={saving} hasError={!!errors.fullName}
              onChange={(v) => update('fullName', v)} />
          </FieldWrap>

          {/* Exercise Status */}
          <FieldWrap label="Status" required error={errors.exerciseStatus}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s} type="button" disabled={saving}
                  onClick={() => update('exerciseStatus', s)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition duration-150 text-xs font-bold cursor-pointer ${getStatusClass(s, form.exerciseStatus === s)}`}
                >
                  <span className={getStatusIconClass(s, form.exerciseStatus === s)}>
                    <StatusIcon status={s} />
                  </span>
                  {s}
                </button>
              ))}
            </div>
          </FieldWrap>

          {/* Arm of Service */}
          {form.exerciseStatus && form.exerciseStatus !== 'Civilians' && (
            <FieldWrap label="Arm of Service" required error={errors.armOfService}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ARM_OPTIONS.map((arm) => (
                  <button
                    key={arm} type="button" disabled={saving}
                    onClick={() => update('armOfService', arm)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition duration-150 text-xs font-bold cursor-pointer ${getArmClass(arm, form.armOfService === arm)}`}
                  >
                    <span className={getArmIconClass(arm, form.armOfService === arm)}>
                      <ArmIcon arm={arm} />
                    </span>
                    {arm}
                  </button>
                ))}
              </div>
            </FieldWrap>
          )}

          {/* Rank */}
          {form.exerciseStatus && form.exerciseStatus !== 'Civilians' && form.armOfService && (
            <FieldWrap label="Rank" required error={errors.rank}>
              {form.armOfService === 'DCS' ? (
                <InputWithIcon icon={<ChevronsUp size={16} />}
                  id="edit-rank" type="text" placeholder="e.g. Director, Deputy Director"
                  value={form.rank} disabled={saving} hasError={!!errors.rank}
                  onChange={(v) => update('rank', v)} />
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronsUp size={16} />
                  </div>
                  <select
                    id="edit-rank"
                    value={form.rank}
                    onChange={(e) => update('rank', e.target.value)}
                    disabled={saving}
                    className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-8 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${errors.rank ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'}`}
                  >
                    <option value="">Select rank ({form.armOfService})</option>
                    {availableRanks.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              )}
            </FieldWrap>
          )}

          {/* Unit */}
          <FieldWrap label="Unit / Department" required error={errors.unit}>
            <InputWithIcon icon={<Building size={16} />}
              id="edit-unit" type="text" placeholder="Enter unit / department"
              value={form.unit} disabled={saving} hasError={!!errors.unit}
              onChange={(v) => update('unit', v)} />
          </FieldWrap>

          {/* Gender */}
          <FieldWrap label="Gender" required error={errors.gender}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <select
                id="edit-gender"
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                disabled={saving}
                className={`w-full bg-white border text-slate-900 text-sm rounded-lg pl-10 pr-8 py-2.5 focus:outline-none focus:ring-1 transition duration-200 appearance-none ${errors.gender ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'}`}
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

          {/* Phone */}
          <FieldWrap label="Phone Number" required error={errors.phone}>
            <InputWithIcon icon={<Phone size={16} />}
              id="edit-phone" type="tel" placeholder="e.g. 024 123 4567"
              value={form.phone} disabled={saving} hasError={!!errors.phone}
              onChange={(v) => update('phone', v)} />
          </FieldWrap>

          {/* Email */}
          <FieldWrap label="Email Address" required error={errors.email}>
            <InputWithIcon icon={<Mail size={16} />}
              id="edit-email" type="email" placeholder="e.g. name@domain.mil.gh"
              value={form.email} disabled={saving} hasError={!!errors.email}
              onChange={(v) => update('email', v)} />
          </FieldWrap>

          {/* Appointment */}
          <FieldWrap label="Appointment / Position" optional>
            <InputWithIcon icon={<Briefcase size={16} />}
              id="edit-appointment" type="text" placeholder="Enter appointment or position"
              value={form.appointment} disabled={saving} hasError={false}
              onChange={(v) => update('appointment', v)} />
          </FieldWrap>

          {/* Notes */}
          <FieldWrap label="Notes" optional>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                <StickyNote size={16} />
              </div>
              <textarea
                id="edit-notes"
                rows={3}
                placeholder="Any additional notes…"
                value={form.notes}
                disabled={saving}
                onChange={(e) => update('notes', e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition duration-200 resize-none"
              />
            </div>
          </FieldWrap>

          {/* Entry Status */}
          <FieldWrap label="Entry Status">
            <div className="relative">
              <select
                id="edit-status"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                disabled={saving}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-400 transition duration-200 appearance-none"
              >
                {ENTRY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Changing to ENTERED will mark this personnel as checked in. This will NOT update the enteredAt timestamp automatically — use the QR scanner for proper check-in.
            </p>
          </FieldWrap>

        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-5 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving
              ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
              : <><CheckCircle2 size={13} /> Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
