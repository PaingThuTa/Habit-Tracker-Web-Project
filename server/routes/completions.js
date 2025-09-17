import express from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { habitId } = req.query

    // First get user's habit IDs to ensure they only see their completions
    const userHabits = await req.db.collection('habits').find({ userId: req.user.userId }).toArray()
    const userHabitIds = userHabits.map(habit => habit.id)

    let filter = { habitId: { $in: userHabitIds } }
    if (habitId && userHabitIds.includes(habitId)) {
      filter = { habitId }
    }

    const completions = await req.db.collection('completions').find(filter).toArray()
    res.json(completions)
  } catch (error) {
    console.error('Error fetching completions:', error)
    res.status(500).json({ error: 'Failed to fetch completions' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { habitId, timestamp } = req.body

    // Verify the habit belongs to the authenticated user
    const habit = await req.db.collection('habits').findOne({ id: habitId, userId: req.user.userId })
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    const completion = {
      id: generateId('cmp'),
      habitId,
      timestamp: timestamp || Date.now()
    }

    const result = await req.db.collection('completions').insertOne(completion)
    res.status(201).json(completion)
  } catch (error) {
    console.error('Error creating completion:', error)
    res.status(500).json({ error: 'Failed to create completion' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const completionId = req.params.id

    // First get the completion to verify it exists and get its habitId
    const completion = await req.db.collection('completions').findOne({ id: completionId })
    if (!completion) {
      return res.status(404).json({ error: 'Completion not found' })
    }

    // Verify the habit belongs to the authenticated user
    const habit = await req.db.collection('habits').findOne({ id: completion.habitId, userId: req.user.userId })
    if (!habit) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await req.db.collection('completions').deleteOne({ id: completionId })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Completion not found' })
    }

    res.json({ message: 'Completion deleted successfully' })
  } catch (error) {
    console.error('Error deleting completion:', error)
    res.status(500).json({ error: 'Failed to delete completion' })
  }
})

export default router