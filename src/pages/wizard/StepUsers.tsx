import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../lib/firebase'

const addUser = httpsCallable(functions, 'superAdminAddUser')
const ROLES = ['attendee', 'staff', 'admin'] as const

interface ExistingUser {
  uid: string
  name: string
  email: string
  role: string
}

export function StepUsers() {
  const [users, setUsers] = useState<ExistingUser[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('attendee')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ROLES))
    return onSnapshot(q, (snap) => {
      setUsers(
        snap.docs.map((d) => ({
          uid: d.id,
          name: d.data().name ?? '',
          email: d.data().email ?? '',
          role: d.data().role ?? '',
        }))
      )
    })
  }, [])

  async function createUser() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.')
      return
    }
    setError(null)
    setCreating(true)
    try {
      await addUser({ email: email.trim(), password, name: name.trim(), role })
      setName('')
      setEmail('')
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">
        For admin, staff and attendee accounts. Speakers have their own step
        (they need a title, company and photo for their agenda listing).
      </p>
      <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-4">
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
        <button
          onClick={createUser}
          disabled={creating}
          className="col-span-2 rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Add user'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {ROLES.map((r) => {
          const inRole = users.filter((u) => u.role === r)
          if (inRole.length === 0) return null
          return (
            <div key={r}>
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                {r} ({inRole.length})
              </p>
              <div className="space-y-1 mb-3">
                {inRole.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between rounded border border-slate-200 p-2 px-3"
                  >
                    <p className="text-sm text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {users.length === 0 && (
          <p className="text-sm text-slate-400">No users added yet.</p>
        )}
      </div>
    </div>
  )
}
