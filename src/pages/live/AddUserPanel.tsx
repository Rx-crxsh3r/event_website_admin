import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase'

const addUser = httpsCallable(functions, 'superAdminAddUser')
const ROLES = ['attendee', 'staff', 'speaker', 'admin'] as const

export function AddUserPanel() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('attendee')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.')
      return
    }
    setCreating(true)
    setError(null)
    setMessage(null)
    try {
      await addUser({ email: email.trim(), password, name: name.trim(), role })
      setMessage(`${name} added as ${role}.`)
      setName('')
      setEmail('')
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add user.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="font-medium text-slate-900 mb-4">Add a user</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Temporary password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-2">{message}</p>}
      <button
        onClick={handleCreate}
        disabled={creating}
        className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
      >
        {creating ? 'Adding…' : 'Add user'}
      </button>
    </div>
  )
}
