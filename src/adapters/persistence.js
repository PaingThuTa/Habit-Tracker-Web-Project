// This page stores the habits and completions in MongoDB via API

import { useAuthStore } from '@/store/useAuthStore'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `${basePath}/api`

// Function to make API requests with Microsoft authentication
async function apiRequest(endpoint, options = {}) {
  try {
    // Get fresh access token
    const accessToken = await useAuthStore.getState().getAccessToken()

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        useAuthStore.getState().logout()
        throw new Error('Authentication required')
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request failed:', error)
    if (error.message === 'Authentication required') {
      throw error
    }
    throw new Error('Persistence unavailable')
  }
}

// Function component to generate an ID
function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

// Function component to get the habits
export async function getHabits() {
  return await apiRequest('/habits')
}
  
// Function component to save a habit
export async function saveHabit(habit) {
  if (habit.id) {
    return await apiRequest(`/habits/${habit.id}`, {
      method: 'PUT',
      body: JSON.stringify(habit),
    })
  } else {
    return await apiRequest('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    })
  }
}

// Function component to delete a habit
export async function deleteHabit(habitId) {
  await apiRequest(`/habits/${habitId}`, {
    method: 'DELETE',
  })
}

// Function component to get all completions
export async function getAllCompletions() {
  return await apiRequest('/completions')
}
  
// Function component to get the completions for a habit
export async function getCompletions(habitId) {
  return await apiRequest(`/completions?habitId=${habitId}`)
}

// Function component to add a completion
export async function addCompletion(habitId, timestamp) {
  return await apiRequest('/completions', {
    method: 'POST',
    body: JSON.stringify({ habitId, timestamp }),
  })
}

export async function removeCompletion(completionId) {
  await apiRequest(`/completions/${completionId}`, {
    method: 'DELETE',
  })
}

export async function updateCompletion(completionId, updates) {
  return await apiRequest(`/completions/${completionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function replaceAll(habits, completions) {
  for (const habit of habits) {
    await saveHabit(habit)
  }
  for (const completion of completions) {
    await addCompletion(completion.habitId, completion.timestamp)
  }
}

// Categories
export async function getCategories() {
  return await apiRequest('/categories')
}

export async function createCategory(name) {
  return await apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateCategory(id, updates) {
  return await apiRequest(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deleteCategory(id) {
  return await apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  })
}
