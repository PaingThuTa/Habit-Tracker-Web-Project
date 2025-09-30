// auth store for the habit tracker

'use client'

import { create } from 'zustand'
import { PublicClientApplication } from '@azure/msal-browser'

const loginRequest = {
  scopes: ['User.Read'],
  prompt: 'select_account',
}

let msalInstance = null

function createMsalConfig() {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined
  const baseUrl = origin ? `${origin}/habit-tracker` : undefined
  return {
    auth: {
      clientId: '68357b1a-48ee-462c-9bb4-3a7e6a008ef6',
      authority: 'https://login.microsoftonline.com/c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f',
      redirectUri: baseUrl,
      postLogoutRedirectUri: baseUrl,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
    system: {
      allowNativeBroker: false,
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return
          }
          switch (level) {
            case 'Error':
              console.error(message)
              return
            case 'Info':
              console.info(message)
              return
            case 'Verbose':
              console.debug(message)
              return
            case 'Warning':
              console.warn(message)
              return
            default:
              return
          }
        },
      },
    },
  }
}

function ensureMsalInstance() {
  if (typeof window === 'undefined') return null
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(createMsalConfig())
  }
  return msalInstance
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,

  async initialize() {
    const instance = ensureMsalInstance()
    if (!instance) {
      set({ isLoading: false })
      return
    }

    try {
      await instance.initialize()

      const accounts = instance.getAllAccounts()
      if (accounts.length > 0) {
        const account = accounts[0]
        instance.setActiveAccount(account)

        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account,
          })

          await get().verifyWithBackend(response.accessToken)
        } catch (error) {
          console.log('Silent token acquisition failed, user needs to login again')
          set({ isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('MSAL initialization failed:', error)
      set({ error: 'Failed to initialize authentication', isLoading: false })
    }
  },

  async login() {
    const instance = ensureMsalInstance()
    if (!instance) {
      set({ error: 'Authentication is unavailable', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const response = await instance.loginPopup(loginRequest)

      if (response) {
        instance.setActiveAccount(response.account)
        await get().verifyWithBackend(response.accessToken)
      }
    } catch (error) {
      console.error('Login failed:', error)
      set({
        error: 'Failed to login with Microsoft. Please try again.',
        isLoading: false,
      })
    }
  },

  async logout() {
    const instance = ensureMsalInstance()

    try {
      if (instance) {
        const account = instance.getActiveAccount()
        if (account) {
          instance.setActiveAccount(null)
        }
      }

      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        error: null,
        isLoading: false,
      })
    } catch (error) {
      console.error('Logout failed:', error)
      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        error: null,
        isLoading: false,
      })
    }
  },

  async getAccessToken() {
    const instance = ensureMsalInstance()
    if (!instance) {
      throw new Error('Authentication is unavailable')
    }

    try {
      const account = instance.getActiveAccount()
      if (!account) {
        throw new Error('No active account')
      }

      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      })

      set({ accessToken: response.accessToken })
      return response.accessToken
    } catch (error) {
      console.error('Token acquisition failed:', error)
      try {
        const response = await instance.acquireTokenPopup(loginRequest)
        set({ accessToken: response.accessToken })
        return response.accessToken
      } catch (interactiveError) {
        console.error('Interactive token acquisition failed:', interactiveError)
        throw interactiveError
      }
    }
  },

  async verifyWithBackend(accessToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/auth/microsoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      })

      if (!response.ok) {
        throw new Error('Backend verification failed')
      }

      const data = await response.json()

      set({
        user: data.user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Backend verification failed:', error)
      set({
        error: 'Failed to verify user with backend',
        isLoading: false,
        isAuthenticated: false,
      })
      throw error
    }
  },

  clearError() {
    set({ error: null })
  },
}))

if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}
