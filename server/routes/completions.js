import express from 'express'

const router = express.Router()

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

router.get('/', async (req, res) => {
  try {
    const { habitId } = req.query
    const filter = habitId ? { habitId } : {}
    
    const completions = await req.db.collection('completions').find(filter).toArray()
    res.json(completions)
  } catch (error) {
    console.error('Error fetching completions:', error)
    res.status(500).json({ error: 'Failed to fetch completions' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { habitId, timestamp } = req.body
    
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

router.delete('/:id', async (req, res) => {
  try {
    const completionId = req.params.id
    
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