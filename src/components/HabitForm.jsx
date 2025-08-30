// Form to create or edit a habit

import { useState, useId } from 'react'
import { useHabitsStore } from '../store/useHabitsStore'
import { startOfDay } from 'date-fns'
import IconPicker from './IconPicker'

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

// Function component to create or edit a habit
export default function HabitForm({ initialValue, onSubmit, onCancel }) {
  const { habits } = useHabitsStore()
  const [name, setName] = useState(initialValue?.name || '')
  const [description, setDescription] = useState(initialValue?.description || '')
  const [periodType, setPeriodType] = useState(initialValue?.periodType || 'daily')
  const [frequency, setFrequency] = useState(initialValue?.frequency || 1)
  const [category, setCategory] = useState(initialValue?.category || '')
  const [icon, setIcon] = useState(initialValue?.icon || 'check_circle')
  const [errors, setErrors] = useState({})
  const uid = useId()
  const nameId = `name-${uid}`
  const descId = `description-${uid}`
  const periodId = `period-${uid}`
  const freqId = `frequency-${uid}`
  const categoryId = `category-${uid}`
  const dataListId = `categories-${uid}`
  const categoryOptions = Array.from(new Set((habits || []).map((h) => h.category).filter(Boolean))).sort((a, b) => a.localeCompare(b))

  // Function to validate the form
  function validate() {
    const next = {}
    if (!name.trim()) next.name = 'Name is required'
    const freq = Number(frequency)
    if (!Number.isInteger(freq) || freq < 1) next.frequency = 'Frequency must be an integer ≥ 1'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // Function to handle the form submission
  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const todayStart = startOfDay(new Date()).getTime()
    const payload = {
      ...(initialValue?.id ? { id: initialValue.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      periodType,
      frequency: Number(frequency),
      category: category.trim() || undefined,
      icon,
      startDate: todayStart,
    }
    onSubmit?.(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={nameId} className="block mb-1 text-sm font-medium">Name</label>
        <input
          id={nameId}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 focus:border-slate-400 focus:outline-none"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          required
        />
        {errors.name ? <p id={`${nameId}-error`} className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
      </div>
      <div>
        <label htmlFor={descId} className="block mb-1 text-sm font-medium">Description</label>
        <textarea
          id={descId}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 focus:border-slate-400 focus:outline-none"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={periodId} className="block mb-1 text-sm font-medium">Period</label>
          <select
            id={periodId}
            name="periodType"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 focus:border-slate-400 focus:outline-none"
          >
            {PERIODS.map((p) => ( 
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={freqId} className="block mb-1 text-sm font-medium">Frequency</label>
          <input
            id={freqId}
            name="frequency"
            type="number"
            min={1}
            step={1}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 focus:border-slate-400 focus:outline-none"
            aria-invalid={!!errors.frequency}
            aria-describedby={errors.frequency ? `${freqId}-error` : undefined}
          />
          {errors.frequency ? <p id={`${freqId}-error`} className="mt-1 text-sm text-red-600">{errors.frequency}</p> : null}
        </div>
      </div>
      <div>
        <label htmlFor={categoryId} className="block mb-1 text-sm font-medium">Category</label>
        <input
          id={categoryId}
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 focus:border-slate-400 focus:outline-none"
          list={dataListId}
          placeholder={categoryOptions.length ? 'Type or choose…' : 'Type a category'}
          autoComplete="off"
        />
        {categoryOptions.length ? (
          <datalist id={dataListId}>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        ) : null}
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium">Icon</label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  )
}


