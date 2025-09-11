import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import HabitDetail from './pages/HabitDetail'
import Habits from './pages/Habits'
import './index.css'
import Sidebar from './components/Sidebar'

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">Skip to content</a>
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <main id="main-content" className="min-h-screen" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/habit/:id" element={<HabitDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
