import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useHabitsStore } from '../store/useHabitsStore'
import { computeCurrentPeriodProgress, computeFailCount, computeRecord, computeStreaks } from '../utils/metrics'

export default function HabitDetail() {
  const { id } = useParams()
  const { habits, completions } = useHabitsStore()
  const habit = habits.find((h) => h.id === id)
  const habitCompletions = completions.filter((c) => c.habitId === id)

  const stats = useMemo(() => {
    if (!habit) return null
    const progress = computeCurrentPeriodProgress(habit, habitCompletions)
    const { currentStreak, bestStreak } = computeStreaks(habit, habitCompletions)
    const failCount = computeFailCount(habit, habitCompletions)
    const record = computeRecord(habit, habitCompletions)
    return { progress, currentStreak, bestStreak, failCount, record }
  }, [habit, habitCompletions])

  if (!habit) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Link to="/" className="text-sm hover:underline">← Back</Link>
        <div className="mt-4">Habit not found.</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="text-sm hover:underline">← Back</Link>
        <div className="flex items-center gap-2">
          <span className="material-icons text-slate-700">{habit.icon}</span>
          <h1 className="text-2xl font-bold">{habit.name}</h1>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <div className="rounded border p-3">
          <div className="text-slate-500">Current period</div>
          <div className="text-xl font-semibold">{stats?.progress.value}/{habit.frequency}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-slate-500">Current streak</div>
          <div className="text-xl font-semibold">{stats?.currentStreak || 0}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-slate-500">Best streak</div>
          <div className="text-xl font-semibold">{stats?.bestStreak || 0}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-slate-500">Fails</div>
          <div className="text-xl font-semibold">{stats?.failCount || 0}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-slate-500">Record</div>
          <div className="text-xl font-semibold">{stats?.record || 0}</div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Recent completions</h2>
        <ul className="space-y-2 text-sm">
          {habitCompletions.slice().sort((a,b) => b.timestamp - a.timestamp).slice(0, 50).map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700">
              <span>{new Date(c.timestamp).toLocaleString()}</span>
              <span className="text-slate-500">Period #{c._periodIndex ?? ''}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}


