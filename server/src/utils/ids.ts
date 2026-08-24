import { randomBytes } from 'node:crypto'

export function createRegistrationId() {
  return `REG-${randomBytes(4).toString('hex').toUpperCase()}`
}
