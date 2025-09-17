export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const accessToken = authHeader.replace('Bearer ', '')

    // Verify token with Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Microsoft token' })
    }

    const profile = await response.json()

    // Find user in our database by Microsoft ID
    const user = await req.db.collection('users').findOne({ microsoftId: profile.id })
    if (!user) {
      return res.status(401).json({ error: 'User not found in system' })
    }

    // Add user info to request for use in route handlers
    req.user = {
      userId: user.id,
      microsoftId: user.microsoftId,
      email: user.email,
      name: user.name
    }

    next()

  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ error: 'Failed to verify token' })
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null
      return next()
    }

    const accessToken = authHeader.replace('Bearer ', '')

    // Verify token with Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      req.user = null
      return next()
    }

    const profile = await response.json()

    // Find user in our database
    const user = await req.db.collection('users').findOne({ microsoftId: profile.id })
    if (!user) {
      req.user = null
      return next()
    }

    req.user = {
      userId: user.id,
      microsoftId: user.microsoftId,
      email: user.email,
      name: user.name
    }

    next()

  } catch (error) {
    req.user = null
    next()
  }
}