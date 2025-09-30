// habit detail page for the habit tracker

'use client'

import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'
import Modal from '@/components/Modal'
import { useHabitsStore } from '@/store/useHabitsStore'
import { computeCurrentPeriodProgress, computeFailCount, computeRecord, computeStreaks } from '@/utils/metrics'
import { formatShortDuration, getCurrentPeriodLabel, getMsUntilPeriodEnd, getPeriodIndex, getPeriodTypeTitle } from '@/utils/time'

function toLocalInputValue(ts) {
  const date = new Date(ts)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export default function HabitDetail() {
  const { id } = useParams()
  const { habits, completions, addCompletion, undoLastCompletion, updateCompletion, rehydrate } = useHabitsStore()
  const habit = habits.find((h) => h.id === id)
  const habitCompletions = completions.filter((c) => c.habitId === id)
  const [range, setRange] = useState('30')
  const [editingCompletion, setEditingCompletion] = useState(null)
  const [editTimestamp, setEditTimestamp] = useState('')
  const [editError, setEditError] = useState('')
  const [isHydrating, setIsHydrating] = useState(false)

  const stats = useMemo(() => {
    if (!habit) return null
    const progress = computeCurrentPeriodProgress(habit, habitCompletions)
    const { currentStreak, bestStreak } = computeStreaks(habit, habitCompletions)
    const failCount = computeFailCount(habit, habitCompletions)
    const record = computeRecord(habit, habitCompletions)
    return { progress, currentStreak, bestStreak, failCount, record }
  }, [habit, habitCompletions])

  // Ensure local hydration on direct entry or transient empty store
  useEffect(() => {
    if (habits.length === 0) {
      let alive = true
      setIsHydrating(true)
      Promise.resolve(rehydrate()).finally(() => { if (alive) setIsHydrating(false) })
      return () => { alive = false }
    }
  }, [habits.length, rehydrate])

  if (isHydrating || habits.length === 0) {
    return (
      <div className="p-4 mx-auto max-w-3xl">Loading…</div>
    )
  }

  if (!habit) {
    return (
      <div className="p-4 mx-auto max-w-3xl">
        <Link href="/" className="text-sm hover:underline">← Back</Link>
        <div className="mt-4">Habit not found.</div>
      </div>
    )
  }

  const isComplete = (stats?.progress.value || 0) >= (habit.frequency || 1)
  const periodLabel = getCurrentPeriodLabel(habit)
  const msUntilReset = getMsUntilPeriodEnd(habit)
  const resetsIn = formatShortDuration(msUntilReset)
  const periodTypeTitle = getPeriodTypeTitle(habit.periodType)
  const habitCreationTs = habit.createdAt || habit.startDate || 0
  const unit = habit.periodType === 'weekly' ? 'week' : habit.periodType === 'monthly' ? 'month' : 'day'

  function handleMarkDone() {
    addCompletion(habit.id)
  }
  async function handleUndo() {
    await undoLastCompletion(habit.id)
  }

  async function handleCompletionUpdate(event) {
    event.preventDefault()
    if (!editingCompletion || !editTimestamp) return
    const nextTimestamp = new Date(editTimestamp).getTime()
    if (Number.isNaN(nextTimestamp)) return
    if (nextTimestamp > Date.now()) {
      setEditError('Timestamp cannot be in the future.')
      return
    }
    if (habitCreationTs && nextTimestamp < habitCreationTs) {
      setEditError('Timestamp cannot be earlier than when the habit was created.')
      return
    }
    await updateCompletion(editingCompletion.id, { timestamp: nextTimestamp })
    setEditingCompletion(null)
    setEditTimestamp('')
    setEditError('')
  }

  const latestInCurrentPeriod = habitCompletions
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .find((c) => {
      const start = startOfDay(new Date()).getTime()
      const end = start + 24 * 60 * 60 * 1000
      return c.timestamp >= start && c.timestamp < end
    })

  const sorted = habitCompletions.slice().sort((a, b) => b.timestamp - a.timestamp)
  const cutoffTs = range === 'all' ? 0 : Date.now() - Number(range) * 24 * 60 * 60 * 1000
  const filtered = sorted.filter((c) => c.timestamp >= cutoffTs)
  const groupsMap = new Map()
  for (const c of filtered) {
    const key = startOfDay(new Date(c.timestamp)).getTime()
    const list = groupsMap.get(key) || []
    list.push(c)
    groupsMap.set(key, list)
  }
  const groups = Array.from(groupsMap.entries()).sort((a, b) => b[0] - a[0])

  function headerFor(ts) {
    const d = new Date(ts)
    if (isToday(d)) return 'Today'
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d, yyyy')
  }

  function periodNumberLabel(ts) {
    const idx = getPeriodIndex(habit, ts)
    if (habit.periodType === 'weekly') return `Week ${idx + 1}`
    if (habit.periodType === 'monthly') return `Month ${idx + 1}`
    return `Day ${idx + 1}`
  }

  return (
    <div className="p-6 mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center text-sm">
          <Link href="/" className="hover:underline">Habits</Link>
          <span className="text-slate-400">›</span>
          <span className="text-slate-600">{habit.name}</span>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 items-center">
            <span className="material-icons text-slate-700">{habit.icon}</span>
            <h1 className="text-2xl font-bold">{habit.name}</h1>
          </div>
          <div className="hidden gap-2 items-center ml-3 md:flex">
            <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">{periodTypeTitle}</span>
            <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">Target {habit.frequency}/{unit}</span>
          </div>
          <div className="ml-4">
            {isComplete ? (
              <div className="flex gap-2 items-center">
                <span className="px-3 py-2 text-sm text-green-700 bg-green-50 rounded">Done {periodLabel.toLowerCase()}</span>
                {latestInCurrentPeriod ? (
                  <button onClick={handleUndo} className="text-sm text-slate-600 hover:underline">Undo</button>
                ) : null}
              </div>
            ) : (
              <button onClick={handleMarkDone} className="btn btn-primary">Mark done</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="flex justify-center items-center md:col-span-1">
          <div className="relative">
            <ProgressBar
              value={stats?.progress.value || 0}
              max={habit.frequency}
              variant="circle"
              size={160}
              stroke={12}
              label={periodLabel}
            />
            <div className="mt-2 text-xs text-center text-slate-500">Resets in {resetsIn}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm md:col-span-2 sm:grid-cols-3">
          <div className="p-3 rounded border">
            <div className="text-slate-500">Streak</div>
            <div className="text-xl font-semibold">{stats?.currentStreak || 0}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-slate-500">Best streak</div>
            <div className="text-xl font-semibold">{stats?.bestStreak || 0}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-slate-500">Missed</div>
            <div className="text-xl font-semibold">{stats?.failCount || 0}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Activity</h2>
          <div className="flex gap-1 text-xs">
            {['7','30','all'].map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-2 py-1 rounded ${range===key? 'bg-slate-900 text-white':'bg-slate-100 text-slate-600'}`}
              >{key==='all'?'All':`${key}d`}</button>
            ))}
          </div>
        </div>
        {groups.length === 0 ? (
          <div className="text-sm text-slate-600">No activity in this range.</div>
        ) : (
          <div className="space-y-4">
            {groups.map(([dayTs, items]) => (
              <div key={dayTs}>
                <div className="mb-2 text-sm font-medium text-slate-700">{headerFor(dayTs)}</div>
                <ul className="space-y-2 text-sm">
                  {items.map((c, idx) => (
                    <li key={c.id} className="flex justify-between items-center p-2 rounded border dark:border-slate-700">
                      <div className="flex gap-3 items-center">
                        <span>{format(new Date(c.timestamp), 'p')}</span>
                        <span className="text-slate-500">{periodNumberLabel(c.timestamp)}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => {
                          setEditingCompletion(c)
                          setEditTimestamp(toLocalInputValue(c.timestamp))
                          setEditError('')
                        }} className="text-xs text-slate-600 hover:underline">Edit</button>
                        {idx === 0 && isToday(new Date(dayTs)) ? (
                          <button onClick={handleUndo} className="text-xs text-slate-600 hover:underline">Undo</button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal isOpen={!!editingCompletion} onClose={() => { setEditingCompletion(null); setEditTimestamp(''); setEditError('') }} title="Edit completion">
        {editingCompletion ? (
          <form onSubmit={handleCompletionUpdate} className="space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Timestamp
              <input
                type="datetime-local"
                value={editTimestamp}
                onChange={(event) => setEditTimestamp(event.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                required
                min={habitCreationTs ? toLocalInputValue(habitCreationTs) : undefined}
                max={toLocalInputValue(Date.now())}
              />
            </label>
            {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setEditingCompletion(null); setEditTimestamp(''); setEditError('') }} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}



