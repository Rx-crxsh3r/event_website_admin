import { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { SessionEntry, SpeakerEntry, SponsorEntry } from '../../lib/types'

interface Props {
  draftId: string
}

// Mirrors the 1-5 scale documented on Session.priority in
// lib/core/models/session_model.dart - keep these two in sync.
const PRIORITY_LEVELS = [
  { value: 1, label: '1 - Low', hint: 'Optional breakout sessions' },
  { value: 2, label: '2 - Below normal', hint: 'Specialized workshops' },
  { value: 3, label: '3 - Normal', hint: 'Regular talks' },
  { value: 4, label: '4 - High', hint: 'Featured speakers, important announcements' },
  { value: 5, label: '5 - Maximum', hint: 'Keynotes, urgent updates, main event streams' },
] as const

export function StepSessions({ draftId }: Props) {
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [speakers, setSpeakers] = useState<SpeakerEntry[]>([])
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([])
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(0)
  const [priority, setPriority] = useState(3)
  const [partnerId, setPartnerId] = useState('')
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([])

  useEffect(() => {
    const q = query(collection(db, 'sessions'), where('eventId', '==', draftId))
    const unsubSessions = onSnapshot(q, (snap) => {
      setSessions(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            eventId: data.eventId,
            title: data.title ?? '',
            description: data.description ?? '',
            startTime: data.startTime?.toDate().toISOString() ?? '',
            endTime: data.endTime?.toDate().toISOString() ?? '',
            location: data.location ?? '',
            speakerIds: data.speakerIds ?? [],
            liveStreamUrl: data.liveStreamUrl ?? '',
            capacity: data.capacity ?? 0,
            priority: data.priority ?? 3,
            partnerId: data.partnerId ?? '',
          }
        })
      )
    })
    const speakersQuery = query(collection(db, 'users'), where('role', '==', 'speaker'))
    const unsubSpeakers = onSnapshot(speakersQuery, (snap) => {
      setSpeakers(
        snap.docs.map((d) => ({
          uid: d.id,
          name: d.data().name ?? '',
          email: d.data().email ?? '',
          title: d.data().title ?? '',
          company: d.data().company ?? '',
          bio: d.data().bio ?? '',
          profileImageUrl: d.data().profileImageUrl ?? '',
        }))
      )
    })
    const sponsorsQuery = query(collection(db, 'sponsors'), where('eventId', '==', draftId))
    const unsubSponsors = onSnapshot(sponsorsQuery, (snap) => {
      setSponsors(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SponsorEntry, 'id'>) }))
      )
    })
    return () => {
      unsubSessions()
      unsubSpeakers()
      unsubSponsors()
    }
  }, [draftId])

  async function addSession() {
    if (!title.trim() || !startTime || !endTime) return
    await addDoc(collection(db, 'sessions'), {
      eventId: draftId,
      title: title.trim(),
      description: '',
      startTime: Timestamp.fromDate(new Date(startTime)),
      endTime: Timestamp.fromDate(new Date(endTime)),
      location: location.trim(),
      speakerIds: selectedSpeakers,
      liveStreamUrl: '',
      capacity,
      // Written explicitly (matching Session's Dart-side defaults) so
      // the session doc always has these fields from creation, rather
      // than relying on every Firestore rule that reads them to also
      // handle "field genuinely absent" as a special case.
      priority,
      partnerId,
      isChatEnabled: true,
      closedBy: '',
      checkedInAttendees: [],
      totalMessages: 0,
      uniqueParticipants: [],
      mutedUsers: [],
      deletedMessagesCount: 0,
      messagesByRole: {},
      muteHistory: [],
      totalMuteActions: 0,
      totalFeedbacks: 0,
      totalRating: 0,
      averageRating: 0,
    })
    setTitle('')
    setLocation('')
    setStartTime('')
    setEndTime('')
    setCapacity(0)
    setPriority(3)
    setPartnerId('')
    setSelectedSpeakers([])
  }

  async function removeSession(id: string) {
    await deleteDoc(doc(db, 'sessions', id))
  }

  function toggleSpeaker(uid: string) {
    setSelectedSpeakers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Session title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Start time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              End time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              min={0}
              placeholder="0 = unlimited"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Max attendees who can check in. 0 means no limit.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {PRIORITY_LEVELS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {PRIORITY_LEVELS.find((p) => p.value === priority)?.hint} - controls
              sorting and highlighting in the app's agenda, not check-in capacity.
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">Speakers</p>
          <div className="flex flex-wrap gap-2">
            {speakers.map((s) => (
              <button
                key={s.uid}
                onClick={() => toggleSpeaker(s.uid)}
                className={`rounded-full px-3 py-1 text-xs border ${
                  selectedSpeakers.includes(s.uid)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {s.name}
              </button>
            ))}
            {speakers.length === 0 && (
              <p className="text-xs text-slate-400">
                Add speakers in the previous step first.
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sponsor (optional)
          </label>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">No sponsor</option>
            {sponsors.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
          {sponsors.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Add sponsors in the previous step to link one here.
            </p>
          )}
        </div>
        <button
          onClick={addSession}
          className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
        >
          Add session
        </button>
      </div>

      <div className="space-y-2">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded border border-slate-200 p-3"
          >
            <div>
              <p className="font-medium text-slate-900">{s.title}</p>
              <p className="text-xs text-slate-500">
                {s.location} ·{' '}
                {s.speakerIds
                  .map((id) => speakers.find((sp) => sp.uid === id)?.name)
                  .filter(Boolean)
                  .join(', ') || 'No speakers'}
                {' · '}Priority {s.priority ?? 3}
                {s.partnerId &&
                  ` · Sponsored by ${sponsors.find((sp) => sp.id === s.partnerId)?.name ?? 'unknown'}`}
              </p>
            </div>
            <button
              onClick={() => removeSession(s.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-sm text-slate-400">No sessions yet.</p>
        )}
      </div>
    </div>
  )
}
