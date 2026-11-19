import { useEffect, useState } from 'react'
import './AuthGate.css'

const AUTH_URL = 'http://localhost:8080/auth'

function AuthGate({ children }) {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ==========================================
  // CHECK EXISTING SESSION
  // ==========================================

  useEffect(() => {
    checkCurrentUser()
  }, [])

  async function checkCurrentUser() {
    try {
      const response = await fetch(`${AUTH_URL}/me`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else if (response.status === 401) {
        setUser(null)
      } else {
        throw new Error('Unable to check login status')
      }
    } catch (err) {
      console.error('Session check failed:', err)
      setUser(null)
    } finally {
      setCheckingSession(false)
    }
  }

  // ==========================================
  // LOGIN
  // ==========================================

  async function login(event) {
    event.preventDefault()

    setError('')

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data.error || 'Unable to log in')
      }

      setUser(data)
      clearForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ==========================================
  // REGISTER
  // ==========================================

  async function register(event) {
    event.preventDefault()

    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email and password are required.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)

    try {
      const registerResponse = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })

      const registerData = await readResponse(registerResponse)

      if (!registerResponse.ok) {
        throw new Error(
          registerData.error || 'Unable to create account'
        )
      }

      // Registration currently creates the account but does not
      // create a session, so immediately log the new user in.

      const loginResponse = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const loginData = await readResponse(loginResponse)

      if (!loginResponse.ok) {
        throw new Error(
          loginData.error ||
            'Account created, but automatic login failed'
        )
      }

      setUser(loginData)
      clearForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function logout() {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      setUser(null)
      clearForm()
      setMode('login')
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  async function readResponse(response) {
    const text = await response.text()

    if (!text) {
      return {}
    }

    try {
      return JSON.parse(text)
    } catch {
      return {}
    }
  }

  function clearForm() {
    setName('')
    setEmail('')
    setPassword('')
    setError('')
  }

  function switchMode(newMode) {
    setMode(newMode)
    clearForm()
  }

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (checkingSession) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-brand">
          <div className="auth-logo">H</div>
          <span>Hangout</span>
        </div>

        <p>Loading...</p>
      </div>
    )
  }

  // ==========================================
  // AUTHENTICATION SCREEN
  // ==========================================

  if (!user) {
    const registering = mode === 'register'

    return (
      <div className="auth-page">
        <main className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">H</div>
            <span>Hangout</span>
          </div>

          <div className="auth-heading">
            <h1>
              {registering
                ? 'Create your account'
                : 'Welcome back'}
            </h1>

            <p>
              {registering
                ? 'Create an account and start making plans.'
                : 'Log in to see your events and make plans.'}
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={registering ? register : login}
          >
            {registering && (
              <div className="auth-field">
                <label htmlFor="auth-name">Name</label>

                <input
                  id="auth-name"
                  type="text"
                  placeholder="Navinu Perera"
                  autoComplete="name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>

              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">
                Password
              </label>

              <input
                id="auth-password"
                type="password"
                placeholder={
                  registering
                    ? 'At least 8 characters'
                    : 'Enter your password'
                }
                autoComplete={
                  registering
                    ? 'new-password'
                    : 'current-password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? 'Please wait...'
                : registering
                  ? 'Create account'
                  : 'Log in'}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {registering
                ? 'Already have an account?'
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={() =>
                switchMode(
                  registering ? 'login' : 'register'
                )
              }
            >
              {registering ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ==========================================
  // AUTHENTICATED APPLICATION
  // ==========================================

  return (
    <>
      <div className="account-bar">
        <div className="account-user">
          <div className="account-avatar">
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>

          <div className="account-details">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          Log out
        </button>
      </div>

      {children}
    </>
  )
}

export default AuthGate