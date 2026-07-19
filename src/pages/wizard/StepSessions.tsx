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
import type { SessionEntry, SpeakerEntry } from '../../lib/types'

interface Props {
  draftId: string
}

export function StepSessions({ draftId }: Props) {
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [speakers, setSpeakers] = useState<SpeakerEntry[]>([])
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(0)
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
    return () => {
      unsubSessions()
      unsubSpeakers()
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
      priority: 3,
      partnerId: '',
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
        <div className="grid grid-cols-3 gap-3">
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder="Capacity (0 = unlimited)"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
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
