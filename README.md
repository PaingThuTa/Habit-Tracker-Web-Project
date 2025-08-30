# Habit Tracker (Frontend-only)

Frontend Habit Tracker built with Vite + React (JavaScript) and TailwindCSS. No backend or auth; data is persisted locally via `localStorage` behind an adapter.

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
- `Dashboard` lists habits, lets you create/edit/delete, and quick-complete/undo within current period.
- `HabitDetail` shows per-habit stats: total for current period, current/best streak, fails, and record.

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
