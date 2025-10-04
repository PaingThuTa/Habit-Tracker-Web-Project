'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCategoriesStore } from '@/store/useCategoriesStore'
import { useHabitsStore } from '@/store/useHabitsStore'

export default function CategoriesPage() {
  const { categories, rehydrate, createCategory, updateCategory, deleteCategory, persistenceError } = useCategoriesStore()
  const { habits, rehydrate: rehydrateHabits } = useHabitsStore()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (categories.length === 0) rehydrate()
    if (habits.length === 0) rehydrateHabits()
  }, [categories.length, habits.length, rehydrate, rehydrateHabits])

  const rows = useMemo(() => {
    const counts = new Map()
    for (const h of habits) {
      if (!h.category) continue
      counts.set(h.category, (counts.get(h.category) || 0) + 1)
    }
    return categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ ...c, count: counts.get(c.name) || 0 }))
  }, [categories, habits])

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setBusyId('new')
    await createCategory(name)
    setNewName('')
    setBusyId(null)
  }

  async function handleSave(id) {
    const name = editingName.trim()
    if (!name) { setEditingId(null); return }
    setBusyId(id)
    const saved = await updateCategory(id, { name })
    if (saved) await rehydrateHabits()
    setEditingId(null)
    setBusyId(null)
  }

  async function handleDelete(c) {
    if (!confirm(`Delete category "${c.name}"? Habits will be uncategorized.`)) return
    setBusyId(c.id)
    const ok = await deleteCategory(c.id)
    if (ok !== null) await rehydrateHabits()
    setBusyId(null)
  }

  return (
    <div className="p-6 mx-auto max-w-3xl">
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="text-slate-400">›</span>
        <span className="text-slate-600">Categories</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Categories</h1>

      {persistenceError ? (
        <div className="p-3 mb-4 text-amber-700 bg-amber-50 rounded border border-amber-400" role="alert">
          {persistenceError}
        </div>
      ) : null}

      <form onSubmit={handleAdd} className="flex gap-2 items-center mb-4">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="rounded border border-slate-300 bg-[#f7f1e4] px-3 py-2 text-sm focus:border-slate-400 focus:outline-none flex-1"
        />
        <button className="btn btn-primary" disabled={!newName.trim() || busyId === 'new'}>Add</button>
      </form>

      {rows.length === 0 ? (
        <div className="text-sm text-slate-600">No categories yet.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="flex justify-between items-center p-3 rounded border">
              <div className="flex items-center gap-3">
                <span className="material-icons text-slate-700">label</span>
                {editingId === c.id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="rounded border border-slate-300 bg-[#f7f1e4] px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.count} habit{c.count === 1 ? '' : 's'}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => { setEditingId(null); setEditingName('') }}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => handleSave(c.id)} disabled={busyId === c.id}>Save</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => { setEditingId(c.id); setEditingName(c.name) }}>Rename</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(c)} disabled={busyId === c.id}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
