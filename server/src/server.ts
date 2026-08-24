import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { isFirebaseConfigured } from './config/firebase.js'
import { errorHandler } from './middleware/errorHandler.js'
import { personnelRouter } from './routes/personnelRoutes.js'

const app = express()
const port = Number(process.env.PORT ?? 5000)
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

app.use(helmet())
app.use(cors({ origin: clientOrigin }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: 'firebase', firebaseConfigured: isFirebaseConfigured() })
})

app.use('/api/personnel', personnelRouter)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Entry control API running on http://localhost:${port}`)
})
