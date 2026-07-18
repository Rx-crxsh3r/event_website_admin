import { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../lib/firebase'
import { emptyDraftEvent, type DraftEvent } from '../../lib/types'
import { StepBasics } from './StepBasics'
import { StepVenueMaps } from './StepVenueMaps'
import { StepSponsors } from './StepSponsors'
import { StepSpeakers } from './StepSpeakers'
import { StepSessions } from './StepSessions'
import { StepFeatureFlags } from './StepFeatureFlags'

const launchEvent = httpsCallable(functions, 'superAdminLaunchEvent')

const STEPS = [
  'Basics',
  'Venue Maps',
  'Sponsors',
  'Speakers',
  'Sessions',
  'Feature Flags',
] as const

export function EventWizardPage() {
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftEvent>(emptyDraftEvent)
  const [step, setStep] = useState(0)
  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)

  // Find (or create) the single draft event - server-persisted so the
  // super admin can leave and come back days later.
  useEffect(() => {
    const q = query(
      collection(db, 'events'),
      where('status', '==', 'draft'),
      limit(1)
    )
    const unsubscribe = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0]
        const data = d.data()
        setDraftId(d.id)
        setDraft({
          ...emptyDraftEvent,
          ...data,
          startDate: data.startDate?.toDate
            ? data.startDate.toDate().toISOString().slice(0, 10)
            : '',
          endDate: data.endDate?.toDate
            ? data.endDate.toDate().toISOString().slice(0, 10)
            : '',
        } as DraftEvent)
      } else if (!draftId) {
        const ref = await addDoc(collection(db, 'events'), {
          ...emptyDraftEvent,
          startDate: null,
          endDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setDraftId(ref.id)
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleChange(partial: Partial<DraftEvent>) {
    if (!draftId) return
    setDraft((prev) => ({ ...prev, ...partial }))
    const toSave: Record<string, unknown> = { ...partial, updatedAt: serverTimestamp() }
    if (partial.startDate !== undefined) {
      toSave.startDate = partial.startDate ? Timestamp.fromDate(new Date(partial.startDate)) : null
    }
    if (partial.endDate !== undefined) {
      toSave.endDate = partial.endDate ? Timestamp.fromDate(new Date(partial.endDate)) : null
    }
    await updateDoc(doc(db, 'events', draftId), toSave)
  }

  async function handleLaunch() {
    if (!draftId) return
    setLaunching(true)
    setLaunchError(null)
    try {
      await launchEvent({ eventId: draftId })
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : 'Failed to launch event.')
    } finally {
      setLaunching(false)
    }
  }

  const canLaunch = Boolean(
    draft.name && draft.startDate && draft.endDate && draft.location
  )

  if (!draftId) {
    return <div className="p-8 text-sm text-slate-500">Loading draft…</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Create Event</h2>
        <button
          onClick={handleLaunch}
          disabled={!canLaunch || launching}
          className="rounded bg-green-700 text-white text-sm font-medium px-4 py-2 hover:bg-green-800 disabled:opacity-40"
          title={canLaunch ? '' : 'Fill in name, dates, and location first'}
        >
          {launching ? 'Launching…' : 'Launch Event'}
        </button>
      </div>
      {launchError && <p className="text-sm text-red-600 mb-4">{launchError}</p>}

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              step === i
                ? 'border-slate-900 text-slate-900 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {step === 0 && <StepBasics draft={draft} onChange={handleChange} />}
        {step === 1 && <StepVenueMaps draftId={draftId} />}
        {step === 2 && <StepSponsors draftId={draftId} />}
        {step === 3 && <StepSpeakers />}
        {step === 4 && <StepSessions draftId={draftId} />}
        {step === 5 && <StepFeatureFlags />}
      </div>
    </div>
  )
}
