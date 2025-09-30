// This page calculates the metrics of the habits

import { getCurrentPeriodBounds, getPeriodIndex, getCurrentPeriodIndex } from './time'

// Function component to get the completions by period
export function getCompletionsByPeriod(habit, completions) {
  const map = new Map()
  for (const c of completions) {
    const idx = getPeriodIndex(habit, c.timestamp)
    const list = map.get(idx) || []
    list.push(c)
    map.set(idx, list)
  }
  return map
}

// Function component to check if the period is successful
export function isPeriodSuccessful(habit, periodCompletions) {
  return (periodCompletions?.length || 0) >= habit.frequency
}

// Function component to compute the current period progress
export function computeCurrentPeriodProgress(habit, completions) {
  const { start, end } = getCurrentPeriodBounds(habit)
  const inPeriod = completions.filter((c) => c.timestamp >= start && c.timestamp < end)
  const rawValue = inPeriod.length
  const value = Math.min(rawValue, habit.frequency)
  const ratio = Math.min(1, value / habit.frequency)
  return { value, required: habit.frequency, ratio }
}

// Function component to compute the streaks
export function computeStreaks(habit, completions) {
  const currentIndex = getCurrentPeriodIndex(habit)
  const byPeriod = getCompletionsByPeriod(habit, completions)

  let currentStreak = 0
  for (let i = currentIndex; i >= 0; i--) {
    if (isPeriodSuccessful(habit, byPeriod.get(i))) currentStreak += 1
    else break
  }

  let bestStreak = 0
  let run = 0
  for (let i = 0; i <= currentIndex; i++) {
    if (isPeriodSuccessful(habit, byPeriod.get(i))) {
      run += 1
      if (run > bestStreak) bestStreak = run
    } else {
      run = 0
    }
  }

  return { currentStreak, bestStreak }
}

// Function component to compute the fail count
export function computeFailCount(habit, completions) {
  const currentIndex = getCurrentPeriodIndex(habit)
  const byPeriod = getCompletionsByPeriod(habit, completions)
  let fails = 0
  for (let i = 0; i < currentIndex; i++) {
    if (!isPeriodSuccessful(habit, byPeriod.get(i))) fails += 1
  }
  return fails
}

// Function component to compute the record
export function computeRecord(habit, completions) {
  const byPeriod = getCompletionsByPeriod(habit, completions)
  let record = 0
  for (const list of byPeriod.values()) {
    if (list.length > record) record = list.length
  }
  return record
}


