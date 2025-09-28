// mongodb library for the habit tracker

import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('MONGODB_URI is not defined')
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client
let clientPromise

function getClientPromise() {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().then(async (connected) => {
      await connected.db('admin').command({ ping: 1 })
      return connected
    })
  }
  return global._mongoClientPromise
}

export async function getDatabase() {
  clientPromise = clientPromise || getClientPromise()
  const connected = await clientPromise
  return connected.db('habit-tracker')
}
