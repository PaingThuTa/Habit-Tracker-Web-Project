// health route for the habit tracker ; which is used to check the health of the database

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDatabase()
    const status = db ? 'Connected' : 'Disconnected'
    return NextResponse.json({ status: 'OK', database: status })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ status: 'ERROR', database: 'Disconnected' }, { status: 500 })
  }
}
