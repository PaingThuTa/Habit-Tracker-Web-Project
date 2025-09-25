// me route for the habit tracker ; which is used to get the user details

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

export async function GET(request) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  const { user } = auth
  return NextResponse.json({ user })
}
