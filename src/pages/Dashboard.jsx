import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startOfDay, addDays, addMonths, startOfMonth, eachDayOfInterval, format, getDay } from 'date-fns'
import { useHabitsStore } from '../store/useHabitsStore'
import { computeStreaks } from '../utils/metrics'
import { getAnchorTimestamp, getPeriodIndex } from '../utils/time'

const RANGE_7 = 7
const RANGE_30 = 30

// Function component to show the dashboard
export default function Dashboard() {
  const { habits, completions, rehydrate, persistenceError } = useHabitsStore()
  const [isLoading, setIsLoading] = useState(true)
  const [rangeDays, setRangeDays] = useState(RANGE_7)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const navigate = useNavigate()
  const [liveMessage, setLiveMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    Promise.resolve(rehydrate()).finally(() => {
      if (isMounted) setIsLoading(false)
    })
    return () => { isMounted = false }
  }, [rehydrate])

  const now = new Date()
  const todayStart = startOfDay(now).getTime()
  const rangeStart = addDays(startOfDay(now), 1 - rangeDays).getTime()
  const rangeEndExclusive = addDays(startOfDay(now), 1).getTime()

  useEffect(() => {
    setLiveMessage(`Stats updated for last ${rangeDays} days`)
  }, [rangeDays])

  // Function to get the bounds for a period
  const getPeriodBoundsForIndex = useCallback((habit, index) => {
    const anchor = startOfDay(new Date(getAnchorTimestamp(habit)))
    if (habit.periodType === 'daily') {
      const start = addDays(anchor, index)
      const end = addDays(anchor, index + 1)
      return { start: start.getTime(), end: end.getTime() }
    }
    if (habit.periodType === 'monthly') {
      const start = addMonths(startOfMonth(anchor), index)
      const end = addMonths(startOfMonth(anchor), index + 1)
      return { start: start.getTime(), end: end.getTime() }
    }
    const start = addDays(anchor, index * 7)
    const end = addDays(anchor, (index + 1) * 7)
    return { start: start.getTime(), end: end.getTime() }
  }, [])

  // Function to count scheduled and completed in a range
  const countScheduledAndCompletedInRange = useCallback((habit, habitCompletions) => {
    const firstIndex = getPeriodIndex(habit, rangeStart)
    const lastIndex = getPeriodIndex(habit, rangeEndExclusive - 1)
    let scheduled = 0
    let completed = 0
    for (let i = firstIndex; i <= lastIndex; i++) {
      const bounds = getPeriodBoundsForIndex(habit, i)
      if (bounds.end <= rangeStart || bounds.start >= rangeEndExclusive) continue
      scheduled += habit.frequency
      const inPeriod = habitCompletions.filter((c) => c.timestamp >= bounds.start && c.timestamp < bounds.end)
      completed += Math.min(inPeriod.length, habit.frequency)
    }
    return { scheduled, completed }
  }, [rangeStart, rangeEndExclusive, getPeriodBoundsForIndex])


  const countMissesInRange = useCallback((habit, habitCompletions) => {
    const firstIndex = getPeriodIndex(habit, rangeStart)
    const lastIndex = getPeriodIndex(habit, rangeEndExclusive - 1)
    let misses = 0
    for (let i = firstIndex; i <= lastIndex; i++) {
      const bounds = getPeriodBoundsForIndex(habit, i)
      if (bounds.end <= rangeStart || bounds.start >= rangeEndExclusive) continue
      if (bounds.end > Date.now()) continue
      const inPeriod = habitCompletions.filter((c) => c.timestamp >= bounds.start && c.timestamp < bounds.end)
      const completedCount = Math.min(inPeriod.length, habit.frequency)
      misses += Math.max(0, habit.frequency - completedCount)
    }
    return misses
  }, [rangeStart, rangeEndExclusive, getPeriodBoundsForIndex])

  // Function to get the days in a range
  const daysInRange = useMemo(() => {
    return eachDayOfInterval({ start: new Date(rangeStart), end: new Date(todayStart) })
  }, [rangeStart, todayStart])

  // Function to get the completions in a range
  const completionsInRange = useMemo(() => {
    return completions.filter((c) => c.timestamp >= rangeStart && c.timestamp < rangeEndExclusive)
  }, [completions, rangeStart, rangeEndExclusive])

  // Function to get the completions by day key
  const completionsByDayKey = useMemo(() => {
    const map = new Map()
    for (const c of completions) {
      const key = startOfDay(new Date(c.timestamp)).getTime()
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [completions])

  // Function to get the totals
  const totals = useMemo(() => {
    let totalScheduled = 0
    let totalCompletedScheduled = 0
    let totalMisses = 0
    for (const habit of habits) {
      const habitCompletions = completions.filter((c) => c.habitId === habit.id)
      const { scheduled, completed } = countScheduledAndCompletedInRange(habit, habitCompletions)
      totalScheduled += scheduled
      totalCompletedScheduled += completed
      totalMisses += countMissesInRange(habit, habitCompletions)
    }
    const totalCompletions = completionsInRange.length
    const misses = totalMisses
    const completionRate = totalScheduled > 0 ? totalCompletedScheduled / totalScheduled : 0
    return { totalCompletions, misses, completionRate }
  }, [habits, completions, completionsInRange, countMissesInRange, countScheduledAndCompletedInRange])

  // Function to get the overall streaks
  const overallStreaks = useMemo(() => {
    if (habits.length === 0) return { current: 0, longest: 0 }
    const earliestStart = Math.min(...habits.map((h) => h.startDate || todayStart))
    const allDays = eachDayOfInterval({ start: new Date(startOfDay(new Date(earliestStart)).getTime()), end: new Date(todayStart) })
    let current = 0
    let longest = 0
    let run = 0
    for (const day of allDays) {
      const key = startOfDay(day).getTime()
      const success = (completionsByDayKey.get(key) || 0) > 0
      if (success) {
        run += 1
        if (run > longest) longest = run
      } else {
        run = 0
      }
    }
    for (let i = allDays.length - 1; i >= 0; i--) {
      const key = startOfDay(allDays[i]).getTime()
      const success = (completionsByDayKey.get(key) || 0) > 0
      if (success) current += 1
      else break
    }
    return { current, longest }
  }, [habits, completionsByDayKey, todayStart])

  const filteredHabits = useMemo(() => {
    const q = search.trim().toLowerCase()
    const byQuery = q ? habits.filter((h) => h.name.toLowerCase().includes(q)) : habits
    if (periodFilter === 'all') return byQuery
    return byQuery.filter((h) => h.periodType === periodFilter)
  }, [habits, search, periodFilter])

  function RetryButton() {
    return (
      <button onClick={() => { setIsLoading(true); Promise.resolve(rehydrate()).finally(() => setIsLoading(false)) }} className="btn btn-secondary">
        Retry
      </button>
    )
  }

  // Function to show the KPI
  function KPI({ label, value, alt }) {
    return (
      <div className="p-3 card" aria-busy={isLoading} aria-live="polite">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-semibold" aria-label={alt || label}>{value}</div>
      </div>
    )
  }
  
  // Function to show the trend chart
  function TrendChart() {
    if (persistenceError) {
      return (
        <div className="p-4 card" role="region" aria-label="Completions trend">
          <div className="mb-2 text-sm text-red-700">Failed to load data.</div>
          <RetryButton />
        </div>
      )
    }
    const max = Math.max(1, ...daysInRange.map((d) => completionsByDayKey.get(startOfDay(d).getTime()) || 0))
    const totalInRange = daysInRange.reduce((acc, d) => acc + (completionsByDayKey.get(startOfDay(d).getTime()) || 0), 0)
    return (
      <div className="p-4 card" role="region" aria-label="Completions trend">
        <div className="mb-3 text-sm font-medium">Daily completions</div>
        {totalInRange === 0 ? (
          <div className="text-sm text-slate-600">No completions in this range.</div>
        ) : (
          <div className="flex gap-1 items-end h-32">
            {daysInRange.map((d) => {
              const key = startOfDay(d).getTime()
              const count = completionsByDayKey.get(key) || 0
              const height = Math.round((count / max) * 100)
              return (
                <div key={key} className="flex flex-col items-center w-6">
                  <div
                    className="w-4 rounded-t bg-slate-700"
                    style={{ height: `${height}%` }}
                    title={`${format(d, 'MMM d')}: ${count} completions`}
                  />
                  <div className="mt-1 text-[10px] text-slate-600" aria-hidden>{format(d, 'MM/dd')}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Function to show the weekday histogram
  function WeekdayHistogram() {
    if (persistenceError) {
      return (
        <div className="p-4 card" role="region" aria-label="Weekday histogram">
          <div className="mb-2 text-sm text-red-700">Failed to load data.</div>
          <RetryButton />
        </div>
      )
    }
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
    for (const d of daysInRange) {
      const key = startOfDay(d).getTime()
      const dow = getDay(d)
      weekdayCounts[dow] += completionsByDayKey.get(key) || 0
    }
    const max = Math.max(1, ...weekdayCounts)
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const sum = weekdayCounts.reduce((a, b) => a + b, 0)
    return (
      <div className="p-4 card" role="region" aria-label="Weekday histogram">
        <div className="mb-3 text-sm font-medium">Completions by weekday</div>
        {sum === 0 ? (
          <div className="text-sm text-slate-600">No data to show for this range.</div>
        ) : (
          <div className="flex gap-2 items-end h-32">
            {weekdayCounts.map((v, i) => {
              const height = Math.round((v / max) * 100)
              return (
                <div key={i} className="flex flex-col items-center w-8">
                  <div
                    className="w-6 rounded-t bg-stone-400"
                    style={{ height: `${height}%` }}
                    title={`${labels[i]}: ${v} completions`}
                  />
                  <div className="mt-1 text-[10px] text-slate-600" aria-hidden>{labels[i]}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Function to show the habit table
  function HabitTable() {
    if (habits.length === 0) {
      return (
        <div className="p-6 text-center card">
          <div className="mb-2 text-lg font-semibold">No habits yet</div>
          <p className="mb-4 text-sm text-slate-600">Create your first habit to start tracking progress.</p>
          <Link to="/habits" className="btn btn-primary">
            <span className="text-white align-middle material-icons">add</span>
            <span className="ml-1 align-middle">Create Habit</span>
          </Link>
        </div>
      )
    }
    if (persistenceError) {
      return (
        <div className="p-4 card">
          <div className="mb-2 text-sm text-red-700">Failed to load habits.</div>
          <RetryButton />
        </div>
      )
    }
    const rows = filteredHabits.map((habit) => {
      const habitCompletions = completions.filter((c) => c.habitId === habit.id)
      const { currentStreak, bestStreak } = computeStreaks(habit, habitCompletions)
      const { scheduled, completed } = countScheduledAndCompletedInRange(habit, habitCompletions)
      const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0
      const misses = countMissesInRange(habit, habitCompletions)
      return { habit, currentStreak, bestStreak, rate, misses }
    })
    return (
      <div className="overflow-x-auto p-0 card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="px-3 py-2">Habit</th>
              <th className="px-3 py-2">Current Streak</th>
              <th className="px-3 py-2">Longest Streak</th>
              <th className="px-3 py-2">Completion Rate</th>
              <th className="px-3 py-2">Misses</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ habit, currentStreak, bestStreak, rate, misses }) => (
              <tr
                key={habit.id}
                className="border-t cursor-pointer border-slate-200 hover:bg-stone-100 focus-within:bg-stone-100"
                onClick={() => navigate(`/habit/${habit.id}`)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/habit/${habit.id}`) }}
                aria-label={`View ${habit.name}`}
              >
                <td className="px-3 py-2">
                  <div className="flex gap-2 items-center">
                    <span className="material-icons text-slate-700">{habit.icon}</span>
                    <div className="font-medium">{habit.name}</div>
                  </div>
                </td>
                <td className="px-3 py-2">{currentStreak}</td>
                <td className="px-3 py-2">{bestStreak}</td>
                <td className="px-3 py-2">{rate}%</td>
                <td className="px-3 py-2">{misses}</td>
                <td className="px-3 py-2 text-right">
                  <Link to={`/habit/${habit.id}`} className="btn btn-secondary" onClick={(e) => e.stopPropagation()}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-6" role="main" aria-labelledby="page-title">
      <div aria-live="polite" className="sr-only">{liveMessage}</div>
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 id="page-title" className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2 items-center" role="group" aria-label="Date range">
          <button
            className={`btn ${rangeDays === RANGE_7 ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={rangeDays === RANGE_7}
            onClick={() => setRangeDays(RANGE_7)}
          >
            7 days
          </button>
          <button
            className={`btn ${rangeDays === RANGE_30 ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={rangeDays === RANGE_30}
            onClick={() => setRangeDays(RANGE_30)}
          >
            30 days
          </button>
        </div>
      </div>

      {persistenceError ? (
        <div className="p-3 mb-4 text-amber-700 bg-amber-50 rounded border border-amber-400" role="alert">
          {persistenceError}
        </div>
      ) : null}

      {isLoading ? (
        <section className="grid grid-cols-1 gap-3 mb-6 text-sm md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 h-20 animate-pulse card" />
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-3 mb-6 text-sm md:grid-cols-3 lg:grid-cols-5">
          <KPI label="Current Streak" value={overallStreaks.current} />
          <KPI label="Longest Streak" value={overallStreaks.longest} />
          <KPI label="Completion Rate" value={`${Math.round(totals.completionRate * 100)}%`} />
          <KPI label="Total Completions" value={totals.totalCompletions} />
          <KPI label="Misses" value={totals.misses} />
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2">
        {isLoading ? (
          <div className="p-4 h-60 animate-pulse card" />
        ) : (
          <TrendChart />
        )}
        {isLoading ? (
          <div className="p-4 h-60 animate-pulse card" />
        ) : (
          <WeekdayHistogram />
        )}
      </section>

      <section className="flex gap-2 justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Per-habit breakdown</h2>
        <div className="flex gap-2 items-center">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded border border-slate-300 bg-[#f7f1e4] px-2 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            aria-label="Filter by period"
          >
            <option value="all">All periods</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input
            type="search"
            placeholder="Search habits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-slate-300 bg-[#f7f1e4] px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            aria-label="Search habits"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="p-6 h-60 animate-pulse card" />
      ) : (
        <HabitTable />
      )}
    </div>
  )
}

