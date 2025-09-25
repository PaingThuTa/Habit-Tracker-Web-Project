// auth library for the habit tracker

import { NextResponse } from 'next/server'
import { getDatabase } from './mongodb'

function unauthorized(message) {
  return NextResponse.json({ error: message }, { status: 401 })
}

export async function authenticateRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { response: unauthorized('Access denied. No token provided.') }
    }

    const accessToken = authHeader.replace('Bearer ', '')

    const msRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!msRes.ok) {
      return { response: unauthorized('Invalid Microsoft token') }
    }

    const profile = await msRes.json()
    const db = await getDatabase()
    const user = await db.collection('users').findOne({ microsoftId: profile.id })
    if (!user) {
      return { response: unauthorized('User not found in system') }
    }

    return {
      user: {
        userId: user.id,
        microsoftId: user.microsoftId,
        email: user.email,
        name: user.name,
      },
      profile,
      db,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return {
      response: NextResponse.json({ error: 'Failed to verify token' }, { status: 500 }),
    }
  }
}
