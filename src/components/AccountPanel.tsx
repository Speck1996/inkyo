import { useAuth } from '@/sync/useAuth'
import { syncNow } from '@/sync/engine'
import { useState } from 'react'

export function AccountPanel() {
  const { user, loading, signInWithMagicLink, signOut, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [syncing, setSyncing] = useState(false)

  if (!configured) {
    return (
      <div className="stack">
        <h2 className="section-title">Account</h2>
        <p className="field-hint">
          Sync is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to enable it. The app works fully offline.
        </p>
      </div>
    )
  }

  if (loading) return <div className="stack">Loading account…</div>

  if (!user) {
    return (
      <div className="stack">
        <h2 className="section-title">Sign in to sync</h2>
        <p className="field-hint">We email you a magic link. No password.</p>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={async () => {
            const { error } = await signInWithMagicLink(email)
            setMessage(error ? 'Could not send link.' : 'Check your email for the link.')
          }}
        >
          Send magic link
        </button>
        {message ? <div className="outcome">{message}</div> : null}
      </div>
    )
  }

  return (
    <div className="stack">
      <h2 className="section-title">Account</h2>
      <p className="field-hint">Signed in as {user.email}</p>
      <button
        type="button"
        className="btn btn--primary"
        disabled={syncing}
        onClick={async () => {
          setSyncing(true)
          try {
            const result = await syncNow()
            setMessage(`Pushed ${result.pushed}, pulled ${result.pulled}.`)
          } catch {
            setMessage('Sync failed.')
          } finally {
            setSyncing(false)
          }
        }}
      >
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
      <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>
        Sign out
      </button>
      {message ? <div className="outcome">{message}</div> : null}
    </div>
  )
}
