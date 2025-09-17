import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ServerApiVersion } from 'mongodb'
import habitRoutes from './routes/habits.js'
import completionRoutes from './routes/completions.js'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

let db

async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    })
    
    await client.connect()
    await client.db("admin").command({ ping: 1 })
    
    db = client.db('habit-tracker')
    console.log("Successfully connected to MongoDB!")
    
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

app.use((req, res, next) => {
  req.db = db
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/completions', completionRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: db ? 'Connected' : 'Disconnected' })
})

async function startServer() {
  await connectToMongoDB()
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer().catch(console.error)