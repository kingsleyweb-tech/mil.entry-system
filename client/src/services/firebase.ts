import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  setDoc,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Personnel, PersonnelForm, PersonnelStatus, Stats, VerifyResponse, EntryControlSettings } from '../types/personnel'
import { type FormConfig, DEFAULT_FORM_CONFIG } from '../types/formConfig'
import { getBaseUrl } from '../utils/url'

const COLLECTION = 'personnel'

// ── helpers ──────────────────────────────────────────────────────────────────

function generateRegistrationId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = 'REG-'
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToPersonnel(id: string, data: any): Personnel {
  return {
    id,
    registrationId: data.registrationId ?? '',
    fullName: data.fullName ?? '',
    serviceNumber: data.serviceNumber ?? '',
    armOfService: data.armOfService ?? undefined,
    rank: data.rank ?? '',
    exerciseStatus: data.exerciseStatus ?? '',
    unit: data.unit ?? '',
    gender: data.gender ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    appointment: data.appointment ?? '',
    notes: data.notes ?? '',
    status: data.status ?? 'REGISTERED',
    registeredAt: data.registeredAt instanceof Timestamp
      ? data.registeredAt.toDate().toISOString()
      : data.registeredAt ?? new Date().toISOString(),
    enteredAt: data.enteredAt instanceof Timestamp
      ? data.enteredAt.toDate().toISOString()
      : data.enteredAt ?? undefined,
    verificationCount: data.verificationCount ?? 0,
    lastVerificationAt: data.lastVerificationAt instanceof Timestamp
      ? data.lastVerificationAt.toDate().toISOString()
      : data.lastVerificationAt ?? undefined,
  }
}

async function sendSms(phone: string, registrationId: string) {
  try {
    const successUrl = `${getBaseUrl()}/pass/${registrationId}`
    // Call our Vercel serverless function — avoids CORS and keeps the API key server-side
    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, registrationId, successUrl }),
    })
  } catch (error) {
    console.error('SMS dispatch failed:', error)
  }
}

export async function registerPersonnel(form: PersonnelForm): Promise<{ personnel: Personnel }> {
  // Check for duplicate service number
  const dupSvcQ = query(collection(db, COLLECTION), where('serviceNumber', '==', form.serviceNumber.trim().toUpperCase()))
  const dupSvcSnap = await getDocs(dupSvcQ)
  if (!dupSvcSnap.empty) throw new Error('A personnel record with this service number already exists.')

  // Check for duplicate email address
  const dupEmailQ = query(collection(db, COLLECTION), where('email', '==', form.email.trim().toLowerCase()))
  const dupEmailSnap = await getDocs(dupEmailQ)
  if (!dupEmailSnap.empty) throw new Error('This email address has already been used to register.')

  // Check for duplicate phone number
  const dupPhoneQ = query(collection(db, COLLECTION), where('phone', '==', form.phone.trim()))
  const dupPhoneSnap = await getDocs(dupPhoneQ)
  if (!dupPhoneSnap.empty) throw new Error('This phone number has already been used to register.')

  const registrationId = generateRegistrationId()
  const now = new Date().toISOString()

  // Build the document — strip blank optional fields so they don't clutter Firestore
  const payload: Record<string, unknown> = {
    fullName: form.fullName.trim(),
    serviceNumber: form.serviceNumber.trim().toUpperCase(),
    armOfService: form.armOfService.trim(),
    rank: form.rank.trim(),
    exerciseStatus: form.exerciseStatus.trim(),
    unit: form.unit.trim(),
    gender: form.gender.trim(),
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase(),
    registrationId,
    status: 'REGISTERED' as PersonnelStatus,
    registeredAt: serverTimestamp(),
    verificationCount: 0,
  }

  // Only include optional fields if they have a value
  if (form.appointment?.trim()) payload.appointment = form.appointment.trim()
  if (form.notes?.trim()) payload.notes = form.notes.trim()

  const docRef = await addDoc(collection(db, COLLECTION), payload)

  // Trigger SMS notification asynchronously in the background so it doesn't block the UI
  sendSms(form.phone, registrationId)

  // Build the personnel object locally — avoids a second round-trip to Firestore
  const personnel: Personnel = {
    id: docRef.id,
    registrationId,
    fullName: payload.fullName as string,
    serviceNumber: payload.serviceNumber as string,
    armOfService: payload.armOfService as string,
    rank: payload.rank as string,
    exerciseStatus: payload.exerciseStatus as string,
    unit: payload.unit as string,
    gender: payload.gender as string,
    phone: payload.phone as string,
    email: payload.email as string,
    appointment: payload.appointment as string | undefined,
    notes: payload.notes as string | undefined,
    status: 'REGISTERED',
    registeredAt: now,
    verificationCount: 0,
  }

  return { personnel }
}

export async function getPersonnel(registrationId: string): Promise<{ personnel: Personnel }> {
  const q = query(collection(db, COLLECTION), where('registrationId', '==', registrationId.trim().toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) throw new Error('Registration record not found.')
  const d = snap.docs[0]
  return { personnel: docToPersonnel(d.id, d.data()) }
}

export async function verifyRegistration(registrationId: string): Promise<VerifyResponse> {
  let personnel: Personnel
  try {
    const res = await getPersonnel(registrationId)
    personnel = res.personnel
  } catch {
    return { result: 'NOT_FOUND', message: 'Registration record could not be found.' }
  }

  // increment verification count
  await updateDoc(doc(db, COLLECTION, personnel.id), {
    verificationCount: (personnel.verificationCount ?? 0) + 1,
    lastVerificationAt: serverTimestamp(),
  })

  if (personnel.status === 'REJECTED') {
    return { result: 'NOT_AUTHORIZED', message: 'Personnel is not authorized for entry.', personnel }
  }

  if (personnel.status === 'ENTERED') {
    return { result: 'ALREADY_ENTERED', message: 'This QR code has already been used.', personnel }
  }

  return { result: 'AUTHORIZED', message: 'Personnel is authorized for entry.', personnel }
}

export async function checkInPersonnel(
  registrationId: string,
  preloadedPersonnel?: Personnel
): Promise<{ message: string; personnel: Personnel }> {
  let personnel: Personnel
  if (preloadedPersonnel) {
    personnel = preloadedPersonnel
  } else {
    const res = await getPersonnel(registrationId)
    personnel = res.personnel
  }

  // Verify eligibility
  if (personnel.status === 'REJECTED') {
    throw new Error('This personnel has been REJECTED and is not authorized for entry.')
  }
  if (personnel.status === 'ENTERED') {
    throw new Error('Personnel has already checked in.')
  }

  const nextCount = (personnel.verificationCount ?? 0) + 1
  await updateDoc(doc(db, COLLECTION, personnel.id), {
    status: 'ENTERED',
    enteredAt: serverTimestamp(),
    lastVerificationAt: serverTimestamp(),
    verificationCount: nextCount,
  })

  const updated = { 
    ...personnel, 
    status: 'ENTERED' as PersonnelStatus, 
    enteredAt: new Date().toISOString(),
    lastVerificationAt: new Date().toISOString(),
    verificationCount: nextCount
  }
  return { message: 'Entry successfully recorded.', personnel: updated }
}

export async function listPersonnel(search: string, status: PersonnelStatus | 'ALL'): Promise<{ personnel: Personnel[] }> {
  
  const q = query(collection(db, COLLECTION), orderBy('registeredAt', 'desc'))
  const snap = await getDocs(q)
  let list = snap.docs.map((d) => docToPersonnel(d.id, d.data()))
  if (status !== 'ALL') {
    list = list.filter((p) => p.status === status)
  }

  if (search.trim()) {
    const s = search.trim().toLowerCase().replace(/-/g, '')
    list = list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(s) ||
        p.serviceNumber.toLowerCase().replace(/-/g, '').includes(s) ||
        p.registrationId.toLowerCase().replace(/-/g, '').includes(s) ||
        p.unit.toLowerCase().includes(s) ||
        (p.armOfService ?? '').toLowerCase().includes(s) ||
        p.exerciseStatus.toLowerCase().includes(s) ||
        p.rank.toLowerCase().includes(s),
    )
  }

  return { personnel: list }
}

export async function getStats(): Promise<{ stats: Stats }> {
  const snap = await getDocs(collection(db, COLLECTION))
  const all = snap.docs.map((d) => d.data() as { status: PersonnelStatus })
  return {
    stats: {
      totalRegistered: all.length,
      approved: all.filter((p) => p.status === 'APPROVED').length,
      entered: all.filter((p) => p.status === 'ENTERED').length,
      notYetEntered: all.filter((p) => p.status !== 'ENTERED').length,
      rejected: all.filter((p) => p.status === 'REJECTED').length,
    },
  }
}

export async function verifyAdminLocal(username: string, password: string): Promise<{ success: boolean; token?: string }> {
  const allowedUsername = import.meta.env.VITE_DEV_ADMIN_USERNAME || 'SokoAerial'
  const allowedPassword = import.meta.env.VITE_DEV_ADMIN_PASSWORD || 'soko123'

  if (username.trim().toLowerCase() === allowedUsername.toLowerCase() && password === allowedPassword) {
    return { success: true, token: `soko-auth-local-${Date.now()}` }
  }
  return { success: false }
}

export function subscribeToEntryControl(callback: (settings: EntryControlSettings | null) => void): () => void {
  const docRef = doc(db, 'systemSettings', 'entryControl')
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      let updatedAtStr = undefined
      if (data.updatedAt) {
        if (data.updatedAt instanceof Timestamp) {
          updatedAtStr = data.updatedAt.toDate().toISOString()
        } else {
          updatedAtStr = data.updatedAt
        }
      }
      callback({
        entryEnabled: data.entryEnabled === true,
        updatedAt: updatedAtStr,
        updatedBy: data.updatedBy || '',
      })
    } else {
      callback({
        entryEnabled: false,
      })
    }
  }, (err) => {
    console.error('Error listening to entry control settings:', err)
  })
}

export async function updateEntryControl(enabled: boolean, updatedBy: string): Promise<void> {
  const docRef = doc(db, 'systemSettings', 'entryControl')
  await setDoc(docRef, {
    entryEnabled: enabled,
    updatedAt: serverTimestamp(),
    updatedBy: updatedBy || 'Admin',
  }, { merge: true })
}

export async function bulkCheckInPersonnel(personnelList: Personnel[]): Promise<void> {
  const eligible = personnelList.filter(p => p.status !== 'REJECTED' && p.status !== 'ENTERED')
  if (eligible.length === 0) return

  const chunkSize = 500
  for (let i = 0; i < eligible.length; i += chunkSize) {
    const chunk = eligible.slice(i, i + chunkSize)
    const batch = writeBatch(db)
    for (const p of chunk) {
      const docRef = doc(db, COLLECTION, p.id)
      batch.update(docRef, {
        status: 'ENTERED',
        enteredAt: serverTimestamp(),
        lastVerificationAt: serverTimestamp(),
        verificationCount: (p.verificationCount ?? 0) + 1,
      })
    }
    await batch.commit()
  }
}
export async function deletePersonnel(docId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, docId))
}

// ── Edit Personnel ────────────────────────────────────────────────────────────

/**
 * Updates a personnel document's editable fields.
 * Deliberately excludes registrationId and serviceNumber to prevent accidental
 * corruption of unique identifiers.  Entry/verification fields (enteredAt,
 * verificationCount, lastVerificationAt) are not passed by the edit form so
 * they are also left intact.
 */
export async function updatePersonnel(
  docId: string,
  fields: {
    fullName?: string
    armOfService?: string
    rank?: string
    exerciseStatus?: string
    unit?: string
    gender?: string
    phone?: string
    email?: string
    appointment?: string
    notes?: string
    status?: PersonnelStatus
  },
): Promise<void> {
  const docRef = doc(db, COLLECTION, docId)
  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([_, v]) => v !== undefined)
  )
  await updateDoc(docRef, cleanFields)
}

// ── Export / Import types ─────────────────────────────────────────────────────

/** A serialised Firestore Timestamp that survives JSON round-trip. */
export type SerialisedTimestamp = {
  _type: 'Timestamp'
  seconds: number
  nanoseconds: number
}

/** One personnel record as it appears in an export file. */
export type PersonnelExportRecord = {
  _docId: string
  [key: string]: unknown
}

/** Top-level shape of the exported JSON file. */
export type PersonnelExportFile = {
  _exportVersion: 1
  _exportedAt: string
  _collection: string
  records: PersonnelExportRecord[]
}

// ── Export ────────────────────────────────────────────────────────────────────

function serialiseValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return { _type: 'Timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds } satisfies SerialisedTimestamp
  }
  if (Array.isArray(value)) return value.map(serialiseValue)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serialiseValue(v)]),
    )
  }
  return value
}

/**
 * Fetches every document in the personnel collection (no pagination) and
 * returns a structured export object ready to be serialised as JSON.
 */
export async function exportAllPersonnel(): Promise<PersonnelExportFile> {
  const snap = await getDocs(collection(db, COLLECTION))
  const records: PersonnelExportRecord[] = snap.docs.map((d) => ({
    _docId: d.id,
    ...Object.fromEntries(
      Object.entries(d.data()).map(([k, v]) => [k, serialiseValue(v)]),
    ),
  }))
  return {
    _exportVersion: 1,
    _exportedAt: new Date().toISOString(),
    _collection: COLLECTION,
    records,
  }
}

// ── Import ────────────────────────────────────────────────────────────────────

function deserialiseValue(value: unknown): unknown {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    if (obj._type === 'Timestamp' && typeof obj.seconds === 'number') {
      return new Timestamp(obj.seconds as number, (obj.nanoseconds as number) ?? 0)
    }
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, deserialiseValue(v)]),
    )
  }
  if (Array.isArray(value)) return value.map(deserialiseValue)
  return value
}

export type ImportMode = 'skip' | 'overwrite'

export type ImportResult = {
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

/**
 * Imports personnel records from a previously exported file.
 *
 * - mode 'skip'      → documents whose ID already exists are left unchanged.
 * - mode 'overwrite' → existing documents are fully replaced (merge: false).
 *
 * Records are written in chunks of 499 to stay within Firestore's batch limit.
 * onProgress is called after each chunk with (completed, total).
 */
export async function importPersonnel(
  records: PersonnelExportRecord[],
  mode: ImportMode,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, failed: 0, errors: [] }
  const CHUNK = 499

  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK)
    const batch = writeBatch(db)
    const pendingIds: string[] = []

    for (const record of chunk) {
      try {
        const { _docId, ...rest } = record
        if (!_docId || typeof _docId !== 'string') {
          result.failed++
          result.errors.push(`Record missing _docId at index ${i + chunk.indexOf(record)}`)
          continue
        }

        const docRef = doc(db, COLLECTION, _docId)

        if (mode === 'skip') {
          // We resolve existence checks below, after collecting all refs
          pendingIds.push(_docId)
          // Temporarily store serialised data for later
          ;(docRef as unknown as { _importData?: unknown })._importData = rest
        } else {
          // overwrite — reconstruct Timestamps and write
          const restored = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, deserialiseValue(v)]),
          )
          batch.set(docRef, restored, { merge: false })
        }
      } catch (err) {
        result.failed++
        result.errors.push(String(err))
      }
    }

    if (mode === 'skip' && pendingIds.length > 0) {
      // Check which docs already exist (sequential reads — Firestore doesn't
      // support "get many by ID" in the JS client without separate calls)
      const skipBatch = writeBatch(db)
      let batchHasOps = false
      for (const id of pendingIds) {
        try {
          const record = chunk.find((r) => r._docId === id)
          if (!record) continue
          const { _docId, ...rest } = record
          const docRef = doc(db, COLLECTION, _docId as string)
          const existing = await getDoc(docRef)
          if (existing.exists()) {
            result.skipped++
          } else {
            const restored = Object.fromEntries(
              Object.entries(rest).map(([k, v]) => [k, deserialiseValue(v)]),
            )
            skipBatch.set(docRef, restored)
            batchHasOps = true
            result.imported++
          }
        } catch (err) {
          result.failed++
          result.errors.push(String(err))
        }
      }
      if (batchHasOps) await skipBatch.commit()
    } else if (mode === 'overwrite') {
      await batch.commit()
      result.imported += chunk.length - result.failed
    }

    onProgress?.(Math.min(i + CHUNK, records.length), records.length)
  }

  return result
}

// ── Form Builder Settings ───────────────────────────────────────────────────

export function subscribeToFormConfig(callback: (config: FormConfig) => void): () => void {
  const docRef = doc(db, 'systemSettings', 'registrationForm')
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<FormConfig>
        // Deep merge / fallback with DEFAULT_FORM_CONFIG so missing fields don't crash the form
        const merged: FormConfig = {
          formContent: {
            ...DEFAULT_FORM_CONFIG.formContent,
            ...(data.formContent || {}),
          },
          fields: {
            ...DEFAULT_FORM_CONFIG.fields,
            ...(data.fields || {}),
          },
          statusOptions:
            Array.isArray(data.statusOptions) && data.statusOptions.length > 0
              ? data.statusOptions
              : DEFAULT_FORM_CONFIG.statusOptions,
          armOfServiceOptions:
            Array.isArray(data.armOfServiceOptions) && data.armOfServiceOptions.length > 0
              ? data.armOfServiceOptions
              : DEFAULT_FORM_CONFIG.armOfServiceOptions,
          ranksByArm: {
            ...DEFAULT_FORM_CONFIG.ranksByArm,
            ...(data.ranksByArm || {}),
          },
          otherSettings: {
            ...DEFAULT_FORM_CONFIG.otherSettings,
            ...(data.otherSettings || {}),
          },
        }
        callback(merged)
      } else {
        callback(DEFAULT_FORM_CONFIG)
      }
    },
    (err) => {
      console.error('Error listening to registration form config:', err)
      callback(DEFAULT_FORM_CONFIG)
    }
  )
}

export async function saveFormConfig(config: FormConfig): Promise<void> {
  const docRef = doc(db, 'systemSettings', 'registrationForm')
  await setDoc(docRef, config, { merge: false })
}

export async function resetFormConfigToDefaults(): Promise<void> {
  const docRef = doc(db, 'systemSettings', 'registrationForm')
  await setDoc(docRef, DEFAULT_FORM_CONFIG, { merge: false })
}


