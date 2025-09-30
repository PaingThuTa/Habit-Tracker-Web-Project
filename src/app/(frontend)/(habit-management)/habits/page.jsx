// habits page for the habit tracker

'use client'

import { useEffect, useMemo, useState } from 'react'
import HabitList from '@/components/HabitList'
import Modal from '@/components/Modal'
import HabitForm from '@/components/HabitForm'
import { useHabitsStore } from '@/store/useHabitsStore'
import { useCategoriesStore } from '@/store/useCategoriesStore'

export default function HabitsPage() {
  const { habits, completions, rehydrate, createHabit, persistenceError } = useHabitsStore()
  const { categories, rehydrate: rehydrateCategories } = useCategoriesStore()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])

  useEffect(() => {
    rehydrate()
  }, [rehydrate])

  useEffect(() => {
    if (categories.length === 0) rehydrateCategories()
  }, [categories.length, rehydrateCategories])

  const summary = useMemo(() => {
    let totalCompletions = completions.length
    return { totalCompletions, totalHabits: habits.length }
  }, [habits, completions])

  function onCreate(payload) {
    const saved = createHabit(payload)
    if (saved) setIsOpen(false)
  }

  const categoryNames = useMemo(() => {
    return categories.map((c) => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [categories])

  const hasUncategorized = useMemo(() => habits.some((h) => !h.category), [habits])

  function toggleCategory(name) {
    setSelectedCategories((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])
  }

  const filteredHabits = useMemo(() => {
    const q = query.trim().toLowerCase()
    return habits.filter((h) => {
      const matchesName = !q || (h.name || '').toLowerCase().includes(q)
      const cat = h.category || ''
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(cat)
      return matchesName && matchesCategory
    })
  }, [habits, query, selectedCategories])

  return (
    <div className="p-6" role="main" aria-labelledby="page-title">
      <div className="flex justify-between items-center mb-4">
        <h1 id="page-title" className="text-2xl font-bold">Habits</h1>
      </div>

      {persistenceError ? (
        <div className="p-3 mb-4 text-amber-700 bg-amber-50 rounded border border-amber-400" role="alert">
          {persistenceError}
        </div>
      ) : null}

      <section className="grid grid-cols-3 gap-3 mb-6 text-sm">
        <div className="p-3 card">
          <div className="text-slate-500">Total habits</div>
          <div className="text-xl font-semibold">{summary.totalHabits}</div>
        </div>
        <div className="p-3 card">
          <div className="text-slate-500">Total completions</div>
          <div className="text-xl font-semibold">{summary.totalCompletions}</div>
        </div>
        <div className="p-3 card">
          <div className="text-slate-500">Today</div>
          <div className="text-xl font-semibold">{new Date().toLocaleDateString()}</div>
        </div>
      </section>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search habits by name"
              className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 bg-[#f7f1e4] text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            <div className="text-xs text-slate-600">{filteredHabits.length} of {habits.length} shown</div>
            <button onClick={() => setIsOpen(true)} className="btn btn-primary">
              <span className="text-white align-middle material-icons">add</span>
              <span className="ml-1 align-middle">New Habit</span>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {categoryNames.map((name) => {
            const active = selectedCategories.includes(name)
            const baseClasses = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-colors'
            const visualClasses = active
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white'
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(name)}
                className={`${baseClasses} ${visualClasses}`}
                title={active ? 'Remove filter' : 'Filter by category'}
              >
                <span className="material-icons text-xs leading-none">{active ? 'check' : 'add'}</span>
                <span>{name}</span>
              </button>
            )
          })}
          {hasUncategorized ? (
            (() => {
              const label = 'Uncategorized'
              const val = ''
              const active = selectedCategories.includes(val)
              const baseClasses = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-colors'
              const visualClasses = active
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white'
              return (
                <button
                  key="__uncat"
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(val)}
                  className={`${baseClasses} ${visualClasses}`}
                >
                  <span className="material-icons text-xs leading-none">{active ? 'check' : 'add'}</span>
                  <span>{label}</span>
                </button>
              )
            })()
          ) : null}
          {(selectedCategories.length > 0 || query.trim()) ? (
            <button
              type="button"
              className="text-xs text-slate-600 hover:underline"
              onClick={() => { setSelectedCategories([]); setQuery('') }}
            >Clear</button>
          ) : null}
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="p-6 text-center card">
          <div className="mb-2 text-lg font-semibold">No habits yet</div>
          <p className="mb-4 text-sm text-slate-600">Create your first habit to start tracking progress.</p>
          <button onClick={() => setIsOpen(true)} className="btn btn-primary">
            <span className="text-white align-middle material-icons">add</span>
            <span className="ml-1 align-middle">Create Habit</span>
          </button>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="p-6 text-center card">
          <div className="mb-2 text-lg font-semibold">No matching habits</div>
          <p className="text-sm text-slate-600">Try a different search or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <HabitList items={filteredHabits} />
          </div>
          <div className="space-y-3">
            <div className="p-4 card">
              <h2 className="mb-2 text-lg font-semibold">Tips</h2>
              <ul className="pl-5 text-sm list-disc text-slate-700">
                <li>Use New Habit to add a habit quickly.</li>
                <li>Click the insights icon to view detailed stats.</li>
                <li>Undo removes the latest completion in the current period.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Habit">
        <HabitForm onSubmit={onCreate} onCancel={() => setIsOpen(false)} />
      </Modal>
    </div>
  )
}
