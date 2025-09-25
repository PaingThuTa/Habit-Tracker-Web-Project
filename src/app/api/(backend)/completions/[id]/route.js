// completion delete route for the habit tracker

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

export async function DELETE(request, { params }) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const completionId = params.id

    const completion = await db.collection('completions').findOne({ id: completionId })
    if (!completion) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }

    const habit = await db.collection('habits').findOne({ id: completion.habitId, userId: user.userId })
    if (!habit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await db.collection('completions').deleteOne({ id: completionId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Completion deleted successfully' })
  } catch (error) {
    console.error('Error deleting completion:', error)
    return NextResponse.json({ error: 'Failed to delete completion' }, { status: 500 })
  }
}
