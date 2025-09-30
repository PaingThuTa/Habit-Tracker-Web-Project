'use client'

// Form used to create or edit a habit

import { useEffect, useMemo, useState } from 'react'
import IconPicker from './IconPicker'
import { useCategoriesStore } from '@/store/useCategoriesStore'

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function initialState(initialValue) {
  return {
    name: initialValue?.name || '',
    description: initialValue?.description || '',
    icon: initialValue?.icon || 'check_circle',
    periodType: initialValue?.periodType || 'daily',
    frequency: String(initialValue?.frequency ?? 1),
    category: initialValue?.category || '',
  }
}

export default function HabitForm({ initialValue, onSubmit, onCancel }) {
  const { categories, rehydrate, createCategory } = useCategoriesStore()
  const [form, setForm] = useState(() => initialState(initialValue))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    setForm(initialState(initialValue))
  }, [initialValue])

  useEffect(() => {
    if (categories.length === 0) {
      void rehydrate()
    }
  }, [categories.length, rehydrate])

  const categoryNames = useMemo(() => {
    return categories
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [categories])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function resetCategoryCreator() {
    setNewCategoryName('')
    setCategoryError('')
    setIsCreatingCategory(false)
  }

  function toggleCategoryCreator() {
    if (showCreateCategory) {
      resetCategoryCreator()
    }
    setShowCreateCategory((prev) => !prev)
  }

  async function handleCreateCategory() {
    if (isCreatingCategory) return
    const name = newCategoryName.trim()
    if (!name) {
      setCategoryError('Category name is required.')
      return
    }
    setIsCreatingCategory(true)
    setCategoryError('')
    const created = await createCategory(name)
    if (created) {
      updateField('category', created.name)
      resetCategoryCreator()
      setShowCreateCategory(false)
    } else {
      setCategoryError('Failed to create category.')
      setIsCreatingCategory(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    const name = form.name.trim()
    if (!name) {
      setError('Name is required.')
      return
    }

    const frequency = Number(form.frequency)
    if (!Number.isFinite(frequency) || frequency < 1) {
      setError('Frequency must be at least 1.')
      return
    }

    const payload = {
      name,
      description: form.description.trim(),
      icon: form.icon || 'check_circle',
      periodType: form.periodType,
      frequency,
      category: form.category.trim(),
    }

    try {
      setIsSubmitting(true)
      setError('')
      await Promise.resolve(onSubmit?.(payload))
    } catch (err) {
      console.error('Failed to submit habit form:', err)
      setError('Failed to save habit.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitLabel = initialValue ? 'Save' : 'Create Habit'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded" role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="habit-name">Name</label>
          <input
            id="habit-name"
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            placeholder="e.g. Morning run"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="habit-description">Description</label>
          <textarea
            id="habit-description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            rows={4}
            placeholder="Add more context"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="habit-period">Period</label>
            <select
              id="habit-period"
              value={form.periodType}
              onChange={(e) => updateField('periodType', e.target.value)}
              className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="habit-frequency">Frequency</label>
            <input
              id="habit-frequency"
              type="number"
              min={1}
              value={form.frequency}
              onChange={(e) => updateField('frequency', e.target.value)}
              className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="habit-category">Category</label>
            <div className="flex gap-2">
              <select
                id="habit-category"
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">Uncategorized</option>
                {categoryNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={toggleCategoryCreator}
                className="btn btn-secondary"
              >
                {showCreateCategory ? 'Cancel' : 'New'}
              </button>
            </div>
          </div>
          {showCreateCategory ? (
            <div className="space-y-2 rounded border border-slate-300 bg-[#f7f1e4] p-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => { setNewCategoryName(e.target.value); setCategoryError('') }}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="New category name"
              />
              {categoryError ? (
                <div className="text-xs text-red-600">{categoryError}</div>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="btn btn-primary"
                  disabled={isCreatingCategory}
                >
                  {isCreatingCategory ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Icon</div>
          <IconPicker value={form.icon} onChange={(value) => updateField('icon', value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

