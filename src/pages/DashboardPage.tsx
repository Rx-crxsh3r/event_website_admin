import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { EventWizardPage } from './wizard/EventWizardPage'
import { LiveEventPage } from './live/LiveEventPage'

interface Props {
  user: User
  onSignOut: () => void
}

type ActiveEvent = { id: string; name: string } | null | undefined

export function DashboardPage({ user, onSignOut }: Props) {
  // undefined = still loading, null = no active/published event.
  const [activeEvent, setActiveEvent] = useState<ActiveEvent>(undefined)

  useEffect(() => {
    const q = query(
      collection(db, 'events'),
      where('isActive', '==', true),
      limit(1)
    )
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        setActiveEvent(null)
      } else {
        const d = snap.docs[0]
        setActiveEvent({ id: d.id, name: d.data().name ?? 'Unnamed event' })
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Super Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user.email}</span>
            <button
              onClick={onSignOut}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeEvent === undefined && (
          <div className="p-8 text-sm text-slate-500">Loading…</div>
        )}
        {activeEvent === null && <EventWizardPage />}
        {activeEvent && (
          <LiveEventPage eventId={activeEvent.id} eventName={activeEvent.name} />
        )}
      </main>
    </div>
  )
}
