import express from 'express'

const router = express.Router()

function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

// Verify Microsoft token and auto-create user
router.post('/microsoft', async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' })
    }

    // Verify the token with Microsoft Graph
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Microsoft token' })
    }

    const profile = await response.json()

    // Check if user exists, if not create them
    let user = await req.db.collection('users').findOne({ microsoftId: profile.id })

    if (!user) {
      // Create new user from Microsoft profile
      user = {
        id: generateId('user'),
        microsoftId: profile.id,
        email: profile.mail || profile.userPrincipalName,
        name: profile.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      await req.db.collection('users').insertOne(user)
    } else {
      // Update last login time
      await req.db.collection('users').updateOne(
        { id: user.id },
        { $set: { updatedAt: Date.now() } }
      )
    }

    res.json({
      message: 'Microsoft authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Microsoft auth error:', error)
    res.status(500).json({ error: 'Failed to authenticate with Microsoft' })
  }
})

// Get user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No access token provided' })
    }

    const accessToken = authHeader.replace('Bearer ', '')

    // Verify token with Microsoft Graph
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const profile = await response.json()

    // Find user in our database
    const user = await req.db.collection('users').findOne({ microsoftId: profile.id })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        microsoftId: user.microsoftId
      }
    })

  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ error: 'Failed to get user profile' })
  }
})

export default router