// Sidebar component

import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function navClass({ isActive }) {
  return `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
    isActive ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-800'
  }`
}

// Function component to display the sidebar
export default function Sidebar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="fixed right-4 bottom-4 z-40 p-3 text-white rounded-full shadow bg-slate-700 lg:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-icons">menu</span>
      </button>

      <aside className={`bg-[#f6efdf] p-4 border-r lg:block ${open ? 'fixed inset-y-0 left-0 z-30 w-64' : 'hidden'} lg:static lg:w-auto`} aria-label="Primary">
        <div className="flex justify-between items-center mb-6 text-lg font-semibold text-slate-800">
          <span>Habit Tracker</span>
          <button className="btn btn-secondary btn-icon lg:hidden" aria-label="Close" onClick={() => setOpen(false)}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <nav id="primary-navigation" className="flex flex-col gap-2" aria-label="Primary">
          <NavLink to="/habits" className={navClass} onClick={() => setOpen(false)}>
            <span className="text-base material-icons">checklist</span>
            <span>Habits</span>
          </NavLink>
          <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>
            <span className="text-base material-icons">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
        </nav>
      </aside>
    </>
  )
}


