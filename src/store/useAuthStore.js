import { create } from 'zustand'
import { PublicClientApplication } from '@azure/msal-browser'

const msalConfig = {
  auth: {
    clientId: '68357b1a-48ee-462c-9bb4-3a7e6a008ef6',
    authority: 'https://login.microsoftonline.com/c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
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
      }
    }
  }
}

const msalInstance = new PublicClientApplication(msalConfig)

const loginRequest = {
  scopes: ['User.Read'],
  prompt: 'select_account'
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,

  // Initialize MSAL and check for existing session
  async initialize() {
    try {
      await msalInstance.initialize()

      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        // User is already logged in, get fresh token
        const account = accounts[0]
        msalInstance.setActiveAccount(account)

        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account
          })

          // Verify user with our backend
          await get().verifyWithBackend(response.accessToken)

        } catch {
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

  // Login with Microsoft
  async login() {
    set({ isLoading: true, error: null })

    try {
      const response = await msalInstance.loginPopup(loginRequest)

      if (response) {
        msalInstance.setActiveAccount(response.account)
        await get().verifyWithBackend(response.accessToken)
      }
    } catch (error) {
      console.error('Login failed:', error)
      set({
        error: 'Failed to login with Microsoft. Please try again.',
        isLoading: false
      })
    }
  },

  // Logout (local only - doesn't sign out from Microsoft)
  async logout() {
    try {
      // Clear the active account from MSAL cache
      const account = msalInstance.getActiveAccount()
      if (account) {
        msalInstance.setActiveAccount(null)
      }

      // Clear local state
      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        error: null,
        isLoading: false
      })
    } catch (error) {
      console.error('Logout failed:', error)
      // Force logout locally even if there's an error
      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        error: null,
        isLoading: false
      })
    }
  },

  // Get fresh access token
  async getAccessToken() {
    try {
      const account = msalInstance.getActiveAccount()
      if (!account) {
        throw new Error('No active account')
      }

      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      })

      set({ accessToken: response.accessToken })
      return response.accessToken
    } catch (error) {
      console.error('Token acquisition failed:', error)
      // Try interactive token acquisition
      try {
        const response = await msalInstance.acquireTokenPopup(loginRequest)
        set({ accessToken: response.accessToken })
        return response.accessToken
      } catch (interactiveError) {
        console.error('Interactive token acquisition failed:', interactiveError)
        throw interactiveError
      }
    }
  },

  // Verify token with our backend and get/create user
  async verifyWithBackend(accessToken) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/microsoft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken })
      })

      if (!response.ok) {
        throw new Error('Backend verification failed')
      }

      const data = await response.json()

      set({
        user: data.user,
        accessToken: accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

    } catch (error) {
      console.error('Backend verification failed:', error)
      set({
        error: 'Failed to verify user with backend',
        isLoading: false,
        isAuthenticated: false
      })
      throw error
    }
  },

  // Clear error
  clearError() {
    set({ error: null })
  }
}))

// Initialize auth on store creation
useAuthStore.getState().initialize()