import { useState } from 'react'
import type React from 'react'
import {
  AlertOctagon,
  CheckCircle2,
  Keyboard,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  User,
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { checkInPersonnel, verifyRegistration } from '../services/firebase'
import type { VerifyResponse } from '../types/personnel'
import { formatDate } from '../utils/format'

export function VerifyPage() {
  const [manualId, setManualId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VerifyResponse>()

  const verify = async (registrationId: string) => {
    const cleanId = registrationId.trim().toUpperCase()
    if (!cleanId || loading) return
    setLoading(true)
    setError('')
    try {
      setResult(await verifyRegistration(cleanId))
      setManualId(cleanId)
    } catch (error) {
      setResult({
        result: 'NOT_FOUND',
        message: error instanceof Error ? error.message : 'Registration record could not be found.',
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmEntry = async () => {
    if (!result?.personnel) return
    setLoading(true)
    try {
      const response = await checkInPersonnel(result.personnel.registrationId)
      setResult({ result: 'AUTHORIZED', message: response.message, personnel: response.personnel })
    } catch (error) {
      await verify(result.personnel.registrationId)
      setError(error instanceof Error ? error.message : 'Unable to record entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">Entrance Verification</h1>
        <p className="mt-2 text-slate-600">
          Enter the personnel Registration ID manually to check status and verify entry.
        </p>
        <p className="text-emerald-600 text-[11px] italic font-semibold mt-1">
          "Enhancing Preparedness Through Joint Training"
        </p>
      </div>

      <div className={`grid gap-6 ${result ? 'lg:grid-cols-[380px_1fr]' : 'max-w-md mx-auto'}`}>
        {/* ── Manual Verification Panel ── */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm h-fit">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Keyboard size={20} aria-hidden="true" />
            Verify Personnel
          </h2>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event: React.FormEvent) => {
              event.preventDefault()
              verify(manualId)
            }}
          >
            <label className="text-sm font-semibold text-slate-700">
              Registration ID
              <input
                className="control-input mt-1.5 w-full"
                value={manualId}
                onChange={(event) => setManualId(event.target.value.toUpperCase())}
                placeholder="e.g. REG-8F29A7C1"
                required
              />
            </label>
            <button className="primary-button w-full mt-2" type="submit" disabled={loading}>
              {loading
                ? <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                : <ShieldCheck size={18} aria-hidden="true" />}
              Verify ID
            </button>
          </form>
          {error ? (
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
          ) : null}
        </div>

        {/* ── Result Panel ── */}
        <VerificationResult result={result} loading={loading} onConfirm={confirmEntry} />
      </div>
    </section>
  )
}


function VerificationResult({
  result,
  loading,
  onConfirm,
}: {
  result?: VerifyResponse
  loading: boolean
  onConfirm: () => void
}) {
  if (!result) {
    return null
  }

  if (result.result === 'NOT_FOUND') {
    return (
      <Outcome
        tone="denied"
        icon={<AlertOctagon size={64} />}
        title="NOT FOUND"
        message="No registration record matches this ID. Please check and try again."
      />
    )
  }

  if (result.result === 'NOT_AUTHORIZED') {
    return (
      <Outcome
        tone="warning"
        icon={<ShieldAlert size={64} />}
        title="NOT AUTHORIZED"
        message="This personnel is not authorized for entry."
        personnel={result.personnel}
      />
    )
  }

  if (result.result === 'ALREADY_ENTERED') {
    return (
      <Outcome
        tone="warning"
        icon={<TriangleAlert size={64} />}
        title="ALREADY ENTERED"
        message="THIS QR CODE HAS ALREADY BEEN USED FOR ENTRY."
        personnel={result.personnel}
        showEnteredAt
      />
    )
  }

  const entered = result.personnel?.status === 'ENTERED'
  return (
    <Outcome
      tone="authorized"
      icon={<CheckCircle2 size={64} />}
      title={entered ? 'ENTRY RECORDED' : 'AUTHORIZED FOR ENTRY'}
      message={
        entered
          ? 'Personnel has been successfully checked in. Entry recorded.'
          : 'Registration is valid and approved. Confirm entry to complete check-in.'
      }
      personnel={result.personnel}
    >
      {!entered ? (
        <button
          className="success-button mt-5"
          type="button"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading
            ? <Loader2 className="animate-spin" size={20} aria-hidden="true" />
            : <ShieldCheck size={20} aria-hidden="true" />}
          CONFIRM ENTRY
        </button>
      ) : null}
    </Outcome>
  )
}

function Outcome({
  tone,
  icon,
  title,
  message,
  personnel,
  showEnteredAt,
  children,
}: {
  tone: 'authorized' | 'denied' | 'warning'
  icon: React.ReactNode
  title: string
  message: string
  personnel?: VerifyResponse['personnel']
  showEnteredAt?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={`verification-result ${tone}`}>
      <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{message}</p>

      {personnel ? (
        <div className="mt-6 w-full rounded-md bg-white/80 p-5 text-left shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User size={18} className="text-slate-500" />
              <strong className="text-lg text-slate-950">{personnel.fullName}</strong>
            </div>
            <StatusBadge status={personnel.status} />
          </div>
          <div className="result-grid">
            <span>Service Number</span><b>{personnel.serviceNumber}</b>
            <span>Rank</span><b>{personnel.rank}</b>
            <span>Unit</span><b>{personnel.unit}</b>
            {personnel.appointment && <><span>Appointment</span><b>{personnel.appointment}</b></>}
            {personnel.phone && <><span>Phone</span><b>{personnel.phone}</b></>}
            <span>Registration ID</span><b>{personnel.registrationId}</b>
            <span>Registered At</span><b>{formatDate(personnel.registeredAt)}</b>
            {showEnteredAt && personnel.enteredAt
              ? <><span>Previous Entry</span><b>{formatDate(personnel.enteredAt)}</b></>
              : null}
          </div>
        </div>
      ) : null}
      {children}
    </div>
  )
}
