import type { Request, Response } from 'express'
import type { DocumentData } from 'firebase-admin/firestore'
import { z } from 'zod'
import { FieldValue, getDb } from '../config/firebase.js'
import { HttpError } from '../middleware/errorHandler.js'
import { PERSONNEL_COLLECTION, type Personnel, type PersonnelStatus } from '../models/personnel.js'
import { cleanOptional, cleanText } from '../utils/clean.js'
import { createRegistrationId } from '../utils/ids.js'

const statuses: PersonnelStatus[] = ['REGISTERED', 'APPROVED', 'ENTERED', 'REJECTED']

function collection() {
  return getDb().collection(PERSONNEL_COLLECTION)
}

const registrationSchema = z.object({
  fullName: z.string().min(2),
  serviceNumber: z.string().min(2),
  rank: z.string().min(2),
  unit: z.string().min(2),
  phone: z.string().regex(/^[+()\d\s-]{7,20}$/),
  email: z.string().email(),
  appointment: z.string().optional(),
  notes: z.string().optional(),
})

function serialize(id: string, data: DocumentData): Personnel {
  return { id, ...(data as Omit<Personnel, 'id'>) }
}

async function findByRegistrationId(registrationId: string) {
  const snapshot = await collection().where('registrationId', '==', registrationId).limit(1).get()
  if (snapshot.empty) return undefined
  const doc = snapshot.docs[0]
  return { ref: doc.ref, personnel: serialize(doc.id, doc.data()) }
}

export async function registerPersonnel(request: Request, response: Response) {
  const parsed = registrationSchema.safeParse(request.body)
  if (!parsed.success) throw new HttpError(400, 'Please provide valid registration details.')

  const serviceNumber = cleanText(parsed.data.serviceNumber).toUpperCase()
  const duplicate = await collection().where('serviceNumber', '==', serviceNumber).limit(1).get()
  if (!duplicate.empty) throw new HttpError(409, 'A registration already exists for this service number.')

  let registrationId = createRegistrationId()
  while (await findByRegistrationId(registrationId)) registrationId = createRegistrationId()

  const now = new Date().toISOString()
  const personnel: Personnel = {
    registrationId,
    fullName: cleanText(parsed.data.fullName),
    serviceNumber,
    rank: cleanText(parsed.data.rank),
    unit: cleanText(parsed.data.unit),
    phone: cleanText(parsed.data.phone),
    email: cleanText(parsed.data.email).toLowerCase(),
    appointment: cleanOptional(parsed.data.appointment),
    notes: cleanOptional(parsed.data.notes),
    status: 'APPROVED',
    qrCode: registrationId,
    registeredAt: now,
    verificationCount: 0,
  }

  const doc = await collection().add(personnel)
  response.status(201).json({ personnel: { id: doc.id, ...personnel } })
}

export async function getPersonnel(request: Request, response: Response) {
  const registrationId = cleanText(String(request.params.registrationId)).toUpperCase()
  const record = await findByRegistrationId(registrationId)
  if (!record) throw new HttpError(404, 'Registration record could not be found.')
  response.json({ personnel: record.personnel })
}

export async function verifyPersonnel(request: Request, response: Response) {
  const registrationId = cleanText(request.body.registrationId).toUpperCase()
  if (!/^REG-[A-F0-9]{8}$/.test(registrationId)) {
    throw new HttpError(400, 'Invalid registration ID.')
  }

  const record = await findByRegistrationId(registrationId)
  if (!record) {
    response.status(404).json({ result: 'NOT_FOUND', message: 'Registration record could not be found.' })
    return
  }

  await record.ref.update({
    verificationCount: FieldValue.increment(1),
    lastVerificationAt: new Date().toISOString(),
  })

  const refreshed = await record.ref.get()
  const personnel = serialize(refreshed.id, refreshed.data() ?? {})

  if (personnel.status === 'ENTERED') {
    response.json({ result: 'ALREADY_ENTERED', message: 'THIS QR CODE HAS ALREADY BEEN USED.', personnel })
    return
  }

  if (personnel.status === 'REJECTED' || personnel.status === 'REGISTERED') {
    response.json({ result: 'NOT_AUTHORIZED', message: 'Personnel is not authorized for entry.', personnel })
    return
  }

  response.json({ result: 'AUTHORIZED', message: 'Authorized for entry.', personnel })
}

export async function checkInPersonnel(request: Request, response: Response) {
  const registrationId = cleanText(String(request.params.registrationId)).toUpperCase()
  const record = await findByRegistrationId(registrationId)
  if (!record) throw new HttpError(404, 'Registration record could not be found.')
  if (record.personnel.status === 'ENTERED') throw new HttpError(409, 'This QR code has already been used.')
  if (record.personnel.status !== 'APPROVED') throw new HttpError(400, 'Personnel is not authorized for entry.')

  const enteredAt = new Date().toISOString()
  await record.ref.update({
    status: 'ENTERED',
    enteredAt,
    verificationCount: FieldValue.increment(1),
    lastVerificationAt: enteredAt,
    entryAudit: FieldValue.arrayUnion({
      registrationId,
      personnelId: record.personnel.id,
      enteredAt,
    }),
  })

  const updated = await record.ref.get()
  response.json({ message: 'Personnel has been successfully checked in.', personnel: serialize(updated.id, updated.data() ?? {}) })
}

export async function listPersonnel(request: Request, response: Response) {
  const status = cleanText(request.query.status as string)
  const search = cleanText(request.query.search as string).toLowerCase()
  let snapshot
  if (statuses.includes(status as PersonnelStatus)) {
    snapshot = await collection().where('status', '==', status).get()
  } else {
    snapshot = await collection().get()
  }

  let personnel = snapshot.docs.map((doc) => serialize(doc.id, doc.data()))
  if (search) {
    personnel = personnel.filter((person) =>
      [person.fullName, person.serviceNumber, person.registrationId, person.unit].some((value) =>
        value.toLowerCase().includes(search),
      ),
    )
  }

  personnel.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
  response.json({ personnel })
}

export async function getStats(_request: Request, response: Response) {
  const snapshot = await collection().get()
  const personnel = snapshot.docs.map((doc) => serialize(doc.id, doc.data()))
  response.json({
    stats: {
      totalRegistered: personnel.length,
      approved: personnel.filter((person) => person.status === 'APPROVED').length,
      entered: personnel.filter((person) => person.status === 'ENTERED').length,
      notYetEntered: personnel.filter((person) => person.status === 'APPROVED' || person.status === 'REGISTERED').length,
      rejected: personnel.filter((person) => person.status === 'REJECTED').length,
    },
  })
}

export async function seedDemoData(_request: Request, response: Response) {
  const records = [
    { fullName: 'John Mensah', serviceNumber: 'GAF00123', rank: 'Lieutenant', unit: 'Operations', phone: '+233201000001', email: 'john.mensah.demo@example.com' },
    { fullName: 'Ama Boateng', serviceNumber: 'GAF00456', rank: 'Sergeant', unit: 'Logistics', phone: '+233201000002', email: 'ama.boateng.demo@example.com' },
    { fullName: 'Kojo Asare', serviceNumber: 'GAF00789', rank: 'Captain', unit: 'Signals', phone: '+233201000003', email: 'kojo.asare.demo@example.com' },
  ]

  let created = 0
  for (const item of records) {
    const exists = await collection().where('serviceNumber', '==', item.serviceNumber).limit(1).get()
    if (!exists.empty) continue
    const registrationId = createRegistrationId()
    await collection().add({
      ...item,
      registrationId,
      status: 'APPROVED',
      qrCode: registrationId,
      registeredAt: new Date().toISOString(),
      verificationCount: 0,
      notes: 'Demo record',
    } satisfies Personnel)
    created += 1
  }

  response.json({ message: 'Demo records are ready.', created })
}
