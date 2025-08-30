// List of habits

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHabitsStore } from '../store/useHabitsStore'
import { computeCurrentPeriodProgress } from '../utils/metrics'
import { getCurrentPeriodBounds } from '../utils/time'
import ProgressBar from './ProgressBar'
import Modal from './Modal'
import HabitForm from './HabitForm'

// Function component to list habits
export default function HabitList() {
  const { habits, completions, addCompletion, undoLastCompletion, deleteHabit, updateHabit } = useHabitsStore()
  const [editing, setEditing] = useState(null)

  function handleSave(updates) {
    updateHabit(editing.id, updates)
    setEditing(null)
  }

  const cards = useMemo(() => {
    return habits.map((h) => {
      const cs = completions.filter((c) => c.habitId === h.id)
      const progress = computeCurrentPeriodProgress(h, cs)
      const met = progress.value >= h.frequency
      const { start, end } = getCurrentPeriodBounds(h)
      const canUndo = cs.some((c) => c.timestamp >= start && c.timestamp < end)
      return (
        <div key={h.id} className="p-4 card">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2 items-center">
              <span className="material-icons text-slate-700">{h.icon}</span>
              <div>
                <div className="text-base font-semibold">{h.name}</div>
                <div className="text-xs text-slate-500">{h.category || 'Uncategorized'}</div>
              </div>
              <Link to={`/habit/${h.id}`} className="ml-1 btn btn-secondary btn-icon" aria-label="View stats" title="View stats">
                <span className="material-icons">insights</span>
              </Link>
            </div>
            <div className={`text-sm ${met ? 'text-green-700' : 'text-slate-600'}`}>{progress.value}/{h.frequency}</div>
          </div>
          <ProgressBar value={progress.value} max={h.frequency} />
          <div className="flex justify-between items-center mt-3">
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => addCompletion(h.id, Date.now())} disabled={met} className={`btn btn-primary btn-icon ${met ? 'opacity-60' : ''}`} aria-label="Quick complete" title="Quick complete">
                <span className="material-icons">check_circle</span>
              </button>
              <button onClick={() => undoLastCompletion(h.id)} disabled={!canUndo} className="btn btn-secondary btn-icon" aria-label="Undo last completion" title="Undo last completion">
                <span className="material-icons">undo</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => setEditing(h)} className="btn btn-secondary btn-icon" aria-label="Edit habit" title="Edit habit">
                <span className="material-icons">edit</span>
              </button>
              <button onClick={() => { if (confirm('Delete habit and its completions?')) deleteHabit(h.id) }} className="btn btn-danger btn-icon" aria-label="Delete habit" title="Delete habit">
                <span className="material-icons">delete</span>
              </button>
            </div>
          </div>
        </div>
      )
    })
  }, [habits, completions, addCompletion, undoLastCompletion, deleteHabit])

  return (
    <div className="space-y-3">
      {cards}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Habit">
        {editing ? (
          <HabitForm initialValue={editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        ) : null}
      </Modal>
    </div>
  )
}


