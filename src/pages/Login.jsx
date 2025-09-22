import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/habits')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async () => {
    clearError()
    await login()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f3e7' }}>
      <div className="max-w-md w-full space-y-8 p-8 card">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            Welcome to Habit Tracker
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your Microsoft account to get started
          </p>
        </div>

        <div className="mt-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 btn btn-primary"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18C5.589 18 2 14.411 2 10S5.589 2 10 2s8 3.589 8 8-3.589 8-8 8z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M13.5 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
              </svg>
            </span>
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>

          <div className="mt-6 text-center">
            <div className="text-xs text-slate-500">
              By signing in, you agree to use this application for habit tracking purposes.
              <br />
              Your Microsoft account information will be used to create a secure profile.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}