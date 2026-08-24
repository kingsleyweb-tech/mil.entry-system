export type PersonnelStatus = 'REGISTERED' | 'APPROVED' | 'ENTERED' | 'REJECTED'

export type Personnel = {
  id?: string
  registrationId: string
  fullName: string
  serviceNumber: string
  rank: string
  unit: string
  phone: string
  email: string
  appointment?: string
  notes?: string
  status: PersonnelStatus
  qrCode: string
  registeredAt: string
  enteredAt?: string
  verificationCount: number
  lastVerificationAt?: string
  entryAudit?: Array<{
    registrationId: string
    personnelId: string
    enteredAt: string
  }>
}

export const PERSONNEL_COLLECTION = 'personnel'
