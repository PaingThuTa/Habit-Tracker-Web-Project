// This page stores the habits and completions in localStorage

const HABITS_KEY = 'ht_habits_v1'
const COMPLETIONS_KEY = 'ht_completions_v1'

// Function component to read the JSON from localStorage
function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed
  } catch (e) {
    throw new Error('Persistence unavailable')
  }
}

// Function component to write the JSON to localStorage
function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    throw new Error('Persistence unavailable')
  }
}

// Function component to generate an ID
function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${rand}`
}

// Function component to get the habits
export function getHabits() {
  return readJson(HABITS_KEY, [])
}
  
// Function component to save a habit
export function saveHabit(habit) {
  const habits = getHabits()
  const existingIndex = habits.findIndex((h) => h.id === habit.id)
  const now = Date.now()
  const record = existingIndex >= 0
    ? { ...habits[existingIndex], ...habit, updatedAt: now }
    : { ...habit, id: habit.id || generateId('habit'), createdAt: now, updatedAt: now }
  if (existingIndex >= 0) {
    habits[existingIndex] = record
  } else {
    habits.push(record)
  }
  writeJson(HABITS_KEY, habits)
  return record
}

// Function component to delete a habit
export function deleteHabit(habitId) {
  const habits = getHabits().filter((h) => h.id !== habitId)
  writeJson(HABITS_KEY, habits)
  const completions = getAllCompletions().filter((c) => c.habitId !== habitId)
  writeJson(COMPLETIONS_KEY, completions)
}

// Function component to get all completions
export function getAllCompletions() {
  return readJson(COMPLETIONS_KEY, [])
}
  
// Function component to get the completions for a habit
export function getCompletions(habitId) {
  return getAllCompletions().filter((c) => c.habitId === habitId)
}

// Function component to add a completion
export function addCompletion(habitId, timestamp) {
  const completions = getAllCompletions()
  const record = { id: generateId('cmp'), habitId, timestamp }
  completions.push(record)
  writeJson(COMPLETIONS_KEY, completions)
  return record
}

// Function component to remove a completion
export function removeCompletion(completionId) {
  const completions = getAllCompletions().filter((c) => c.id !== completionId)
  writeJson(COMPLETIONS_KEY, completions)
}
  
// Function component to replace all habits and completions
export function replaceAll(habits, completions) {
  writeJson(HABITS_KEY, habits)
  writeJson(COMPLETIONS_KEY, completions)
}


