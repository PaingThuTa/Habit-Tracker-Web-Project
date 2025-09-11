import { useEffect, useMemo, useState } from 'react'
import { useHabitsStore } from '../store/useHabitsStore'
import HabitList from '../components/HabitList'
import Modal from '../components/Modal'
import HabitForm from '../components/HabitForm'

export default function Habits() {
  const { habits, completions, rehydrate, createHabit, persistenceError } = useHabitsStore()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    rehydrate()
  }, [rehydrate])

  const summary = useMemo(() => {
    let totalCompletions = completions.length
    return { totalCompletions, totalHabits: habits.length }
  }, [habits, completions])

  function onCreate(payload) {
    const saved = createHabit(payload)
    if (saved) setIsOpen(false)
  }

  return (
    <div className="p-6" role="main" aria-labelledby="page-title">
      <div className="flex justify-between items-center mb-6">
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

      <div className="flex justify-end mb-4">
        <button onClick={() => setIsOpen(true)} className="btn btn-primary">
          <span className="text-white align-middle material-icons">add</span>
          <span className="ml-1 align-middle">New Habit</span>
        </button>
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
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <HabitList />
          </div>
          <div className="space-y-3">
            <div className="p-4 card">
              <h2 className="mb-2 text-lg font-semibold">Tips</h2>
              <ul className="pl-5 text-sm list-disc text-slate-700">
                <li>Use the plus button to add new habits.</li>
                <li>Click a habit name to view detailed stats.</li>
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


