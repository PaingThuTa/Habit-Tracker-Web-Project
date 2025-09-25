// microsoft auth route for the habit tracker

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { accessToken } = body || {}

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid Microsoft token' }, { status: 401 })
    }

    const profile = await response.json()
    const db = await getDatabase()
    let user = await db.collection('users').findOne({ microsoftId: profile.id })

    if (!user) {
      user = {
        id: generateId('user'),
        microsoftId: profile.id,
        email: profile.mail || profile.userPrincipalName,
        name: profile.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.collection('users').insertOne(user)
    } else {
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { updatedAt: Date.now() } }
      )
    }

    return NextResponse.json({
      message: 'Microsoft authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Microsoft auth error:', error)
    return NextResponse.json({ error: 'Failed to authenticate with Microsoft' }, { status: 500 })
  }
}
