import { useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, ShieldCheck } from 'lucide-react'
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
    <div className="rp-root">
      {/* ── Top stripe ── */}
      <div className="rp-top-stripe" />

      {/* ── Header ── */}
      <header className="rp-header">
        <div className="rp-header-inner">
          <div className="rp-emblem">
            <img src={gafLogo} alt="GAF Logo" className="rp-emblem-img" />
          </div>
          <div>
            <p className="rp-sup">GHANA ARMED FORCES</p>
            <h1 className="rp-title">EXERCISE RESOLUTE SYNERGY 2026</h1>
            <p className="rp-sub">Personnel Registration Portal</p>
          </div>
        </div>
        <div className="rp-badge">
          <ShieldCheck size={14} aria-hidden="true" />
          Controlled Access Registration
        </div>
      </header>

      {/* ── Main ── */}
      <main className="rp-main">
        <div className="rp-card">
          {/* Card header */}
          <div className="rp-card-head">
            <span className="rp-card-head-icon">
              <FileText size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="rp-card-title">Personnel Registration Form</h2>
            </div>
          </div>

          {/* Info Banner */}
          <div className="rp-info-banner">
            <div>
              <p className="rp-info-title">Secure Personnel Registration</p>
              <p className="rp-info-body">
                Please complete the form below. A unique entrance QR code will be generated on
                submission — <strong>download or print it</strong> to gain access to the hall.
                A confirmation SMS containing your entry pass link will also be sent to your phone.
              </p>
            </div>
          </div>

          {/* Global error */}
          {globalError && (
            <div className="rp-error-banner" role="alert">
              <span>⚠</span> {globalError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} noValidate>
            <div className="rp-grid">
              <Field label="Full Name" value={form.fullName} error={errors.fullName} required onChange={(v) => updateField('fullName', v)} />
              <Field label="Service Number" value={form.serviceNumber} error={errors.serviceNumber} required onChange={(v) => updateField('serviceNumber', v.toUpperCase())} />
              <Field label="Rank" value={form.rank} error={errors.rank} required onChange={(v) => updateField('rank', v)} />
              <Field label="Unit / Department" value={form.unit} error={errors.unit} required onChange={(v) => updateField('unit', v)} />
              <label className={`rp-field${errors.gender ? ' rp-field--error' : ''}`}>
                <span className="rp-field-label">
                  Gender
                  <b className="rp-required"> *</b>
                </span>
                <select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  aria-invalid={Boolean(errors.gender)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <small className="rp-field-error">{errors.gender}</small>}
              </label>
              <Field label="Phone Number" value={form.phone} error={errors.phone} required type="tel" onChange={(v) => updateField('phone', v)} />
              <Field label="Email Address" value={form.email} error={errors.email} required type="email" onChange={(v) => updateField('email', v)} />
              <Field label="Appointment / Position (Optional)" value={form.appointment} onChange={(v) => updateField('appointment', v)} />
            </div>

            <div className="rp-submit-row">
              <p className="rp-security-note">
                <ShieldCheck size={13} aria-hidden="true" />
                You will receive a confirmation SMS with your entry pass link immediately after registering.
              </p>
              <button className="rp-submit-btn" type="submit" disabled={submitting}>
                {submitting
                  ? <><Loader2 className="animate-spin" size={17} /> Submitting…</>
                  : <><ShieldCheck size={17} /> Submit Registration</>}
              </button>
            </div>
          </form>
        </div>

        <p className="rp-footer">
          EXERCISE RESOLUTE SYNERGY 2026 &mdash; Ghana Armed Forces &mdash; Entry Control System
        </p>
      </main>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  type?: string
}

function Field({ label, value, onChange, error, required, type = 'text' }: FieldProps) {
  return (
    <label className={`rp-field${error ? ' rp-field--error' : ''}`}>
      <span className="rp-field-label">
        {label}
        {required && <b className="rp-required"> *</b>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <small className="rp-field-error">{error}</small>}
    </label>
  )
}
