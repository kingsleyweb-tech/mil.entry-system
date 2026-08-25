export type PersonnelStatus = 'REGISTERED' | 'APPROVED' | 'ENTERED' | 'REJECTED'

export type Personnel = {
  id: string
  registrationId: string
  fullName: string
  serviceNumber: string
  armOfService?: string
  rank: string
  exerciseStatus: string
  unit: string
  gender: string
  phone: string
  email: string
  appointment?: string
  notes?: string
  status: PersonnelStatus
  qrCode?: string
  registeredAt: string
  enteredAt?: string
  verificationCount: number
  lastVerificationAt?: string
}

export type PersonnelForm = {
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
}

export type Stats = {
  totalRegistered: number
  approved: number
  entered: number
  notYetEntered: number
  rejected: number
}

export type VerifyResponse = {
  result: 'NOT_FOUND' | 'NOT_AUTHORIZED' | 'AUTHORIZED' | 'ALREADY_ENTERED'
  message: string
  personnel?: Personnel
}

export type EntryControlSettings = {
  entryEnabled: boolean
  updatedAt?: string
  updatedBy?: string
}
