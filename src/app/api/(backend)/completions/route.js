// completions route for the habit tracker

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

export async function GET(request) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const habitId = request.nextUrl.searchParams.get('habitId')

    const userHabits = await db.collection('habits').find({ userId: user.userId }).toArray()
    const userHabitIds = userHabits.map((habit) => habit.id)

    let filter = { habitId: { $in: userHabitIds } }
    if (habitId && userHabitIds.includes(habitId)) {
      filter = { habitId }
    }

    const completions = await db.collection('completions').find(filter).toArray()
    return NextResponse.json(completions)
  } catch (error) {
    console.error('Error fetching completions:', error)
    return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const { habitId, timestamp } = await request.json()

    const habit = await db.collection('habits').findOne({ id: habitId, userId: user.userId })
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const completion = {
      id: generateId('cmp'),
      habitId,
      timestamp: timestamp || Date.now(),
    }

    await db.collection('completions').insertOne(completion)
    return NextResponse.json(completion, { status: 201 })
  } catch (error) {
    console.error('Error creating completion:', error)
    return NextResponse.json({ error: 'Failed to create completion' }, { status: 500 })
  }
}
