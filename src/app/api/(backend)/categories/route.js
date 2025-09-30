export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(request) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const categories = await db.collection('categories').find({ userId: user.userId }).toArray()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const body = await request.json()
    const name = body?.name ? String(body.name).trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const duplicate = await db.collection('categories').findOne({
      userId: user.userId,
      name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 })
    }

    const now = Date.now()
    const category = {
      id: generateId('cat'),
      userId: user.userId,
      name,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('categories').insertOne(category)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
