// This page stores the state of the habits

import { create } from 'zustand'
import {
  getHabits,
  saveHabit as persistHabit,
  deleteHabit as persistDeleteHabit,
  getCompletions as persistGetCompletions,
  addCompletion as persistAddCompletion,
  removeCompletion as persistRemoveCompletion,
  getAllCompletions,
} from '../adapters/persistence'
import { getCurrentPeriodBounds, isInCurrentPeriod } from '../utils/time'

// Function component to store the state of the habits
export const useHabitsStore = create((set, get) => ({
  habits: [],
  completions: [],
  persistenceError: null,

  async rehydrate() {
    try {
      const habits = await getHabits()
      const completions = await getAllCompletions()
      set({ habits, completions, persistenceError: null })
    } catch (e) {
      set({ persistenceError: 'Data storage is unavailable. Changes will not persist.' })
    }
  },

  // Function to create a habit
  async createHabit(input) {
    try {
      const record = await persistHabit(input)
      set((s) => ({ habits: [...s.habits, record], persistenceError: null }))
      return record
    } catch (e) {
      set({ persistenceError: 'Failed to save habit.' })
      return null
    }
  },

  // Function to update a habit
  async updateHabit(id, updates) {
    try {
      const existing = get().habits.find((h) => h.id === id)
      if (!existing) return null
      const saved = await persistHabit({ ...existing, ...updates })
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? saved : h)), persistenceError: null }))
      return saved
    } catch (e) {
      set({ persistenceError: 'Failed to update habit.' })
      return null
    }
  },

  // Function to delete a habit
  async deleteHabit(id) {
    try {
      await persistDeleteHabit(id)
      set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        completions: s.completions.filter((c) => c.habitId !== id),
        persistenceError: null,
      }))
    } catch (e) {
      set({ persistenceError: 'Failed to delete habit.' })
    }
  },

  // Function to add a completion
  async addCompletion(habitId, atTs = Date.now()) {
    const habit = get().habits.find((h) => h.id === habitId)
    if (!habit) return null
    if (!isInCurrentPeriod(habit, atTs)) return null
    const { start, end } = getCurrentPeriodBounds(habit)
    const currentCount = get()
      .completions
      .filter((c) => c.habitId === habitId && c.timestamp >= start && c.timestamp < end)
      .length
    if (currentCount >= habit.frequency) return null
    try {
      const record = await persistAddCompletion(habitId, atTs)
      set((s) => ({ completions: [...s.completions, record], persistenceError: null }))
      return record
    } catch (e) {
      set({ persistenceError: 'Failed to add completion.' })
      return null
    }
  },

  // Function to undo the last completion
  async undoLastCompletion(habitId) {
    const habit = get().habits.find((h) => h.id === habitId)
    if (!habit) return null
    const { start, end } = getCurrentPeriodBounds(habit)
    const inPeriod = get()
      .completions
      .filter((c) => c.habitId === habitId && c.timestamp >= start && c.timestamp < end)
      .sort((a, b) => b.timestamp - a.timestamp)
    if (inPeriod.length === 0) return null
    const target = inPeriod[0]
    try {
      await persistRemoveCompletion(target.id)
      set((s) => ({ completions: s.completions.filter((c) => c.id !== target.id), persistenceError: null }))
      return target
    } catch (e) {
      set({ persistenceError: 'Failed to undo completion.' })
      return null
    }
  },

  // Function to list completions
  async listCompletions(habitId) {
    try {
      return await persistGetCompletions(habitId)
    } catch (e) {
      set({ persistenceError: 'Failed to load completions.' })
      return []
    }
  },
}))


