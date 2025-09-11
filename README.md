# Habit Tracker (Frontend-only)

Frontend Habit Tracker built with Vite + React (JavaScript) and TailwindCSS. Uses a persistence adapter targeting an API (`http://localhost:3001/api`). If the backend is not running, the UI remains functional and surfaces loading/error/empty states.

## Run

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Architecture

- UI: TailwindCSS + Material Icons
- Routing: `react-router-dom`
- State: Zustand store in `src/store/useHabitsStore.js`
- Persistence: `src/adapters/persistence.js` (localStorage)
- Time + Metrics: `src/utils/time.js`, `src/utils/metrics.js`

Pages:
- `Dashboard` shows stats with range toggle (7/30d), KPIs, trend and weekday charts, and per-habit breakdown with search. Default landing route.
- `Habits` lists and manages habits; create/edit/delete and complete/undo within current period.
- `HabitDetail` shows per-habit stats: current period total, current/best streak, fails, and record.

## Dashboard

- Range: 7 or 30 days; KPIs and charts recompute instantly.
- KPIs: Current streak (overall), Longest streak (overall), Completion rate, Total completions, Misses.
- Charts: Daily completions trend and weekday histogram.
- Per-habit table: Current/Longest streak, Completion rate, Misses; search by name; click to detail.
- Loading/empty/error states with accessible labels and retry.

## Accessibility & UX

- Skip link: quick jump to main content from keyboard (Tab at page load).
- Progress bars: proper `role="progressbar"` with `aria-valuenow`, `aria-valuemax`, and friendly `aria-valuetext`.
- Modal: labeled with `aria-labelledby`, restores focus to trigger, Escape closes.
- Forms: labels associated with inputs, inline error messages are linked via `aria-describedby`.
- Navigation: mobile menu button announces state with `aria-expanded` and controls `#primary-navigation`.
- Alerts: persistence/storage errors announced using `role="alert"`.
- Empty states: guidance UI when there are no habits yet.
- Category field: free-text with suggestions via datalist from existing categories.

## Business Rules (summary)

- Periods: daily, weekly (7-day windows anchored to `startDate` or creation), monthly.
- Current period success when completions ≥ frequency.
- Streaks: consecutive successful periods up to current.
- Fail count: required periods before now that were not successful.
- Only current-period completions are allowed/recorded.

## Swapping persistence later

Replace `src/adapters/persistence.js` with an implementation that calls your backend and keep the same functions (`getHabits`, `saveHabit`, `deleteHabit`, `getCompletions`, `addCompletion`, `removeCompletion`). UI should not change.
