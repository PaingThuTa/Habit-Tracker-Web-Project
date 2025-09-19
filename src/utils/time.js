// This page calculates the timestamp of the habits

import {
    addDays,
    addMonths,
    differenceInCalendarDays,
    differenceInCalendarMonths,
    startOfDay,
    startOfMonth,
} from 'date-fns'

// Function component to get the anchor timestamp
export function getAnchorTimestamp(habit, nowTs = Date.now()) {
  const todayStart = startOfDay(new Date(nowTs)).getTime()
  const original = startOfDay(new Date(habit.startDate ? habit.startDate : habit.createdAt)).getTime()
  return Math.max(todayStart, original)
}

// Function component to get the current period bounds
export function getCurrentPeriodBounds(habit, nowTs = Date.now()) {
  const now = new Date(nowTs)
  if (habit.periodType === 'daily') {
    const start = startOfDay(now).getTime()
    const end = addDays(startOfDay(now), 1).getTime()
    return { start, end }
  }
  if (habit.periodType === 'monthly') {
    const start = startOfMonth(now).getTime()
    const end = addMonths(startOfMonth(now), 1).getTime()
    return { start, end }
  }
  const anchor = startOfDay(new Date(getAnchorTimestamp(habit, nowTs)))
  const daysSince = Math.max(0, differenceInCalendarDays(now, anchor))
  const weekIndex = Math.floor(daysSince / 7)
  const start = addDays(anchor, weekIndex * 7).getTime()
  const end = addDays(anchor, (weekIndex + 1) * 7).getTime()
  return { start, end }
}

// Function component to get the milliseconds until the current period ends
export function getMsUntilPeriodEnd(habit, nowTs = Date.now()) {
  const { end } = getCurrentPeriodBounds(habit, nowTs)
  return Math.max(0, end - nowTs)
}

// Function component to format a short duration like "9h" or "12m"
export function formatShortDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days >= 1) return `${days}d`
  if (hours >= 1) return `${hours}h`
  if (minutes >= 1) return `${minutes}m`
  return `${totalSeconds}s`
}

// Function component to map period type to a human title
export function getPeriodTypeTitle(periodType) {
  if (periodType === 'weekly') return 'Weekly'
  if (periodType === 'monthly') return 'Monthly'
  return 'Daily'
}

// Function component to get the current period label used in UI
export function getCurrentPeriodLabel(habit) {
  if (habit.periodType === 'weekly') return 'This week'
  if (habit.periodType === 'monthly') return 'This month'
  return 'Today'
}

// Function component to check if the timestamp is in the current period
export function isInCurrentPeriod(habit, timestamp, nowTs = Date.now()) {
  const { start, end } = getCurrentPeriodBounds(habit, nowTs)
  return timestamp >= start && timestamp < end
}

// Function component to get the period index
export function getPeriodIndex(habit, timestamp) {
  const anchor = startOfDay(new Date(getAnchorTimestamp(habit)))
  const tsDate = new Date(timestamp)
  if (habit.periodType === 'daily') {
    return differenceInCalendarDays(startOfDay(tsDate), anchor)
  }
  if (habit.periodType === 'monthly') {
    return differenceInCalendarMonths(startOfMonth(tsDate), startOfMonth(anchor))
  }
  const days = differenceInCalendarDays(startOfDay(tsDate), anchor)
  return Math.floor(days / 7)
}

// Function component to get the current period index
export function getCurrentPeriodIndex(habit, nowTs = Date.now()) {
  return getPeriodIndex(habit, nowTs)
}

// Function component to enumerate the period indices
export function enumeratePeriodIndices(habit, upToIndex) {
  const indices = []
  for (let i = 0; i <= upToIndex; i++) indices.push(i)
  return indices
}


