import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Personnel, PersonnelForm, PersonnelStatus, Stats, VerifyResponse } from '../types/personnel'

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
    rank: data.rank ?? '',
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
  const apiKey = import.meta.env.VITE_VYNFY_API_KEY
  const senderId = import.meta.env.VITE_VYNFY_SENDER_ID || 'EXRESOLUTE'
  if (!apiKey) {
    console.warn('VITE_VYNFY_API_KEY not defined. SMS skipped.')
    return
  }

  // Normalize phone number format (remove leading 0 or +, add 233 if needed)
  let recipient = phone.trim()
  if (recipient.startsWith('0')) {
    recipient = '233' + recipient.substring(1)
  } else if (recipient.startsWith('+')) {
    recipient = recipient.substring(1)
  }

  const message = `EXERCISE RESOLUTE SYNERGY 2026: Hello, your registration was successful. Your unique ID is ${registrationId}. Download/print your QR code to gain entry.`

  try {
    await fetch('https://api.vynfy.com/v1/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender: senderId,
        recipient: recipient,
        message: message,
      }),
    })
  } catch (error) {
    console.error('Failed to send SMS:', error)
  }
}

export async function registerPersonnel(form: PersonnelForm): Promise<{ personnel: Personnel }> {
  // Validate duplicate service number to prevent double registration
  const dupQ = query(collection(db, COLLECTION), where('serviceNumber', '==', form.serviceNumber.trim().toUpperCase()))
  const dupSnap = await getDocs(dupQ)
  if (!dupSnap.empty) throw new Error('A personnel record with this service number already exists.')

  const registrationId = generateRegistrationId()
  const now = new Date().toISOString()

  // Build the document — strip blank optional fields so they don't clutter Firestore
  const payload: Record<string, unknown> = {
    fullName: form.fullName.trim(),
    serviceNumber: form.serviceNumber.trim().toUpperCase(),
    rank: form.rank.trim(),
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
    rank: payload.rank as string,
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

export async function checkInPersonnel(registrationId: string): Promise<{ message: string; personnel: Personnel }> {
  const { personnel } = await getPersonnel(registrationId)
  await updateDoc(doc(db, COLLECTION, personnel.id), {
    status: 'ENTERED',
    enteredAt: serverTimestamp(),
  })
  const updated = { ...personnel, status: 'ENTERED' as PersonnelStatus, enteredAt: new Date().toISOString() }
  return { message: 'Entry successfully recorded.', personnel: updated }
}

export async function listPersonnel(search: string, status: PersonnelStatus | 'ALL'): Promise<{ personnel: Personnel[] }> {
  let q = query(collection(db, COLLECTION), orderBy('registeredAt', 'desc'))
  if (status !== 'ALL') {
    q = query(collection(db, COLLECTION), where('status', '==', status), orderBy('registeredAt', 'desc'))
  }
  const snap = await getDocs(q)
  let list = snap.docs.map((d) => docToPersonnel(d.id, d.data()))

  if (search.trim()) {
    const s = search.trim().toLowerCase().replace(/-/g, '')
    list = list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(s) ||
        p.serviceNumber.toLowerCase().replace(/-/g, '').includes(s) ||
        p.registrationId.toLowerCase().replace(/-/g, '').includes(s) ||
        p.unit.toLowerCase().includes(s),
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
