import express from 'express'
import { ObjectId } from 'mongodb'

const router = express.Router()

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

router.get('/', async (req, res) => {
  try {
    const habits = await req.db.collection('habits').find({}).toArray()
    res.json(habits)
  } catch (error) {
    console.error('Error fetching habits:', error)
    res.status(500).json({ error: 'Failed to fetch habits' })
  }
})

router.post('/', async (req, res) => {
  try {
    const now = Date.now()
    const habit = {
      ...req.body,
      id: req.body.id || generateId('habit'),
      createdAt: now,
      updatedAt: now
    }
    
    const result = await req.db.collection('habits').insertOne(habit)
    res.status(201).json(habit)
  } catch (error) {
    console.error('Error creating habit:', error)
    res.status(500).json({ error: 'Failed to create habit' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const habitId = req.params.id
    const updates = {
      ...req.body,
      updatedAt: Date.now()
    }
    
    delete updates.id
    delete updates.createdAt
    
    const result = await req.db.collection('habits').findOneAndUpdate(
      { id: habitId },
      { $set: updates },
      { returnDocument: 'after' }
    )
    
    if (!result) {
      return res.status(404).json({ error: 'Habit not found' })
    }
    
    res.json(result)
  } catch (error) {
    console.error('Error updating habit:', error)
    res.status(500).json({ error: 'Failed to update habit' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const habitId = req.params.id
    
    const habitResult = await req.db.collection('habits').deleteOne({ id: habitId })
    
    if (habitResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' })
    }
    
    await req.db.collection('completions').deleteMany({ habitId })
    
    res.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Error deleting habit:', error)
    res.status(500).json({ error: 'Failed to delete habit' })
  }
})

export default router