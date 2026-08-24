import { Router } from 'express'
import {
  checkInPersonnel,
  getPersonnel,
  getStats,
  listPersonnel,
  registerPersonnel,
  seedDemoData,
  verifyPersonnel,
} from '../controllers/personnelController.js'

export const personnelRouter = Router()

personnelRouter.post('/register', registerPersonnel)
personnelRouter.get('/stats', getStats)
personnelRouter.post('/seed-demo', seedDemoData)
personnelRouter.post('/verify', verifyPersonnel)
personnelRouter.post('/:registrationId/check-in', checkInPersonnel)
personnelRouter.get('/:registrationId', getPersonnel)
personnelRouter.get('/', listPersonnel)
