export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function handleUpdate(request, { params }) {
  const auth = await authenticateRequest(request)
  if (auth.response) return auth.response

  try {
    const { db, user } = auth
    const id = params.id
    const updates = await request.json()
    const existing = await db.collection('categories').findOne({ id })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    if (existing.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    const nextName = updates.name ? String(updates.name).trim() : undefined
    const now = Date.now()
    const payload = { updatedAt: now }
    if (nextName) {
      const dup = await db.collection('categories').findOne({
        userId: user.userId,
        id: { $ne: id },
        name: { $regex: `^${escapeRegex(nextName)}$`, $options: 'i' },
      })
      if (dup) {
        return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 })
      }
      payload.name = nextName
    }

    const res = await db.collection('categories').updateOne(
      { id },
      { $set: payload }
    )
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    const saved = await db.collection('categories').findOne({ id })

    if (nextName && nextName !== existing.name) {
      await db.collection('habits').updateMany(
        { userId: user.userId, category: existing.name },
        { $set: { category: nextName, updatedAt: now } }
      )
    }

    return NextResponse.json(saved)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
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
    const id = params.id

    const existing = await db.collection('categories').findOne({ id })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    if (existing.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const res = await db.collection('categories').deleteOne({ id })
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await db.collection('habits').updateMany(
      { userId: user.userId, category: existing.name },
      { $unset: { category: '' }, $set: { updatedAt: Date.now() } }
    )

    return NextResponse.json({ message: 'Category deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
