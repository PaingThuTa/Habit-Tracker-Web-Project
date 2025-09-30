// habit update route for the habit tracker

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

export async function PUT(request, { params }) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const habitId = params.id
    const updates = await request.json()
    const payload = {
      ...updates,
      updatedAt: Date.now(),
    }

    delete payload.id
    delete payload.createdAt
    delete payload.userId
    delete payload._id

    const result = await db.collection('habits').findOneAndUpdate(
      { id: habitId, userId: user.userId },
      { $set: payload },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const habitId = params.id

    const habitResult = await db.collection('habits').deleteOne({ id: habitId, userId: user.userId })

    if (habitResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    await db.collection('completions').deleteMany({ habitId })

    return NextResponse.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
