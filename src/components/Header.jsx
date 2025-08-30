// Header component

import { Link } from 'react-router-dom'

// Function component to display the header
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur bg-white/80">
      <div className="flex justify-between items-center p-3 mx-auto max-w-3xl">
        <Link to="/" className="flex gap-2 items-center font-semibold text-slate-800">
          <span className="material-icons">task_alt</span>
          <span>Habit Tracker</span>
        </Link>
        <div className="text-xs text-slate-500">Local only</div>
      </div>
    </header>
  )
}


