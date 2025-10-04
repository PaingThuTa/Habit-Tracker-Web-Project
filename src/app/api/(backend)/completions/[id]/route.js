// completion delete route for the habit tracker

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

async function handleUpdate(request, { params }) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const completionId = params.id
    const updates = await request.json()

    const completion = await db.collection('completions').findOne({ id: completionId })
    if (!completion) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }

    const habit = await db.collection('habits').findOne({ id: completion.habitId, userId: user.userId })
    if (!habit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const payload = {}

    if (typeof updates.timestamp === 'number') {
      const ts = updates.timestamp
      const minTs = habit.createdAt || habit.startDate || 0
      const now = Date.now()
      if ((minTs && ts < minTs) || ts > now) {
        return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 })
      }
      payload.timestamp = ts
    }

    if (updates.habitId && updates.habitId !== completion.habitId) {
      const targetHabit = await db.collection('habits').findOne({ id: updates.habitId, userId: user.userId })
      if (!targetHabit) {
        return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
      }
      payload.habitId = updates.habitId
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(completion)
    }

    payload.updatedAt = Date.now()

    const result = await db.collection('completions').findOneAndUpdate(
      { id: completionId },
      { $set: payload },
      { returnDocument: 'after' }
    )

    if (!result.value) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }

    return NextResponse.json(result.value)
  } catch (error) {
    console.error('Error updating completion:', error)
    return NextResponse.json({ error: 'Failed to update completion' }, { status: 500 })
  }
}

export async function PUT(request, context) {
  return handleUpdate(request, context)
}

export async function PATCH(request, context) {
  return handleUpdate(request, context)
}

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
