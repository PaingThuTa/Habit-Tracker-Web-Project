'use client'

import { create } from 'zustand'
import {
  getCategories as persistGetCategories,
  createCategory as persistCreateCategory,
  updateCategory as persistUpdateCategory,
  deleteCategory as persistDeleteCategory,
} from '@/adapters/persistence'

export const useCategoriesStore = create((set, get) => ({
  categories: [],
  persistenceError: null,

  async rehydrate() {
    try {
      const categories = await persistGetCategories()
      set({ categories, persistenceError: null })
    } catch (e) {
      set({ persistenceError: 'Failed to load categories.' })
    }
  },

  async createCategory(name) {
    const n = String(name || '').trim()
    if (!n) return null
    try {
      const record = await persistCreateCategory(n)
      set((s) => ({ categories: [...s.categories, record], persistenceError: null }))
      return record
    } catch (e) {
      const message = e?.message?.includes('409') ? 'Category already exists.' : 'Failed to create category.'
      set({ persistenceError: message })
      return null
    }
  },

  async updateCategory(id, updates) {
    try {
      const saved = await persistUpdateCategory(id, updates)
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? saved : c)),
        persistenceError: null,
      }))
      return saved
    } catch (e) {
      set({ persistenceError: 'Failed to update category.' })
      return null
    }
  },

  async deleteCategory(id) {
    try {
      await persistDeleteCategory(id)
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id), persistenceError: null }))
    } catch (e) {
      set({ persistenceError: 'Failed to delete category.' })
    }
  },
}))
