// This page calculates the timestamp of the habits

import {
  startOfDay,
  addDays,
  differenceInCalendarDays,
  startOfMonth,
  addMonths,
  differenceInCalendarMonths,
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


