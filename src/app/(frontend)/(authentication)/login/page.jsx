// login page for the habit tracker

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function LoginPage() {
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/habits')
    }
  }, [isAuthenticated, router])

  const handleLogin = async () => {
    clearError()
    await login()
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="p-8 space-y-8 w-full max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Habit Tracker
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Microsoft account to get started
          </p>
        </div>

        <div className="mt-8">
          {error && (
            <div className="px-4 py-3 mb-4 text-red-700 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex relative justify-center px-4 py-3 w-full text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex absolute inset-y-0 left-0 items-center pl-3">
              <svg className="w-5 h-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18C5.589 18 2 14.411 2 10S5.589 2 10 2s8 3.589 8 8-3.589 8-8 8z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M13.5 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
              </svg>
            </span>
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>

          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500">
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
