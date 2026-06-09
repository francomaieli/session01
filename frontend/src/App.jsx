import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'jwt_session'
const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

function decodePayload(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function buildSession(tokens) {
  const accessPayload = decodePayload(tokens.access_token)
  const refreshPayload = decodePayload(tokens.refresh_token)
  if (!accessPayload?.exp || !refreshPayload?.exp || !accessPayload?.sub) {
    return null
  }

  return {
    username: accessPayload.sub,
    tokenType: tokens.token_type ?? 'bearer',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessExpiresAt: accessPayload.exp * 1000,
    refreshExpiresAt: refreshPayload.exp * 1000,
  }
}

function getStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (Date.now() >= parsed.refreshExpiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

function getCurrentView() {
  return window.location.pathname === '/dashboard' ? 'dashboard' : 'login'
}

function App() {
  const [view, setView] = useState(getCurrentView)
  const [session, setSession] = useState(getStoredSession)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const onPopstate = () => setView(getCurrentView())
    window.addEventListener('popstate', onPopstate)
    return () => window.removeEventListener('popstate', onPopstate)
  }, [])

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    if (view === 'dashboard' && !session) {
      window.history.replaceState({}, '', '/login')
    }
  }, [session, view])

  const accessExpired = !session || currentTime >= session.accessExpiresAt

  const accessExpiration = useMemo(() => {
    if (!session) {
      return '-'
    }
    return new Date(session.accessExpiresAt).toLocaleString()
  }, [session])

  const onLogin = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const response = await fetch(`${backendUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) {
        throw new Error('Credenciales inválidas')
      }

      const tokens = await response.json()
      const nextSession = buildSession(tokens)
      if (!nextSession) {
        throw new Error('No fue posible procesar el token')
      }

      saveSession(nextSession)
      setSession(nextSession)
      window.history.pushState({}, '', '/dashboard')
      setView('dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const onRefresh = async () => {
    if (!session) {
      return
    }

    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      })
      if (!response.ok) {
        throw new Error('No se pudo refrescar el token')
      }

      const tokens = await response.json()
      const refreshedSession = buildSession(tokens)
      if (!refreshedSession) {
        throw new Error('Respuesta de refresco inválida')
      }

      saveSession(refreshedSession)
      setSession(refreshedSession)
    } catch (requestError) {
      clearSession()
      setSession(null)
      setError(requestError.message)
      window.history.replaceState({}, '', '/login')
      setView('login')
    } finally {
      setBusy(false)
    }
  }

  const onLogout = () => {
    clearSession()
    setSession(null)
    setError('')
    window.history.replaceState({}, '', '/login')
    setView('login')
  }

  if (view !== 'dashboard' || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
          <h1 className="mb-1 text-2xl font-bold text-slate-900">Login JWT</h1>
          <p className="mb-6 text-sm text-slate-600">
            Backend: <span className="font-mono">{backendUrl}</span>
          </p>
          <form className="space-y-4" onSubmit={onLogin}>
            <label className="block text-sm font-medium text-slate-700">
              Usuario
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            >
              {busy ? 'Autenticando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">Panel principal</h1>
        <p className="mt-2 text-slate-700">
          Usuario autenticado: <strong>{session?.username}</strong>
        </p>
        <p className="mt-1 text-slate-700">Tipo de token: {session?.tokenType}</p>
        <p className="mt-1 text-slate-700">Expira el: {accessExpiration}</p>
        <p className={`mt-1 text-sm ${accessExpired ? 'text-red-600' : 'text-emerald-600'}`}>
          {accessExpired ? 'El access token está vencido' : 'El access token es válido'}
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy || !session}
            className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {busy ? 'Procesando...' : 'Refrescar token'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md bg-slate-800 px-4 py-2 text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  )
}

export default App
