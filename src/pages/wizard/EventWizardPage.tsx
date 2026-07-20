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
import { uploadEventContentImage } from '../../lib/storage'
import { emptyDraftEvent, type DraftEvent } from '../../lib/types'
import { StepBasics } from './StepBasics'
import { StepVenueMaps } from './StepVenueMaps'
import { StepSponsors } from './StepSponsors'
import { StepUsers } from './StepUsers'
import { StepSpeakers } from './StepSpeakers'
import { StepSessions } from './StepSessions'
import { StepFeatureFlags } from './StepFeatureFlags'

const launchEvent = httpsCallable(functions, 'superAdminLaunchEvent')
const addUser = httpsCallable(functions, 'superAdminAddUser')

// Demo accounts created by "Prefill demo data" - all share this password.
const DEMO_PASSWORD = 'abc123'
const DEMO_USERS = [
  { email: 'admin1@example.com', name: 'Admin One', role: 'admin' },
  { email: 'staff1@example.com', name: 'Staff One', role: 'staff' },
  { email: 'staff2@example.com', name: 'Staff Two', role: 'staff' },
  { email: 'speaker1@example.com', name: 'Speaker One', role: 'speaker', title: 'Program Director', company: 'ImpactConnect Foundation' },
  { email: 'speaker2@example.com', name: 'Speaker Two', role: 'speaker', title: 'Community Organizer', company: 'Northstar Youth Alliance' },
  { email: 'speaker3@example.com', name: 'Speaker Three', role: 'speaker', title: 'Research Lead', company: 'Bright Futures Collective' },
  { email: 'attendee1@example.com', name: 'Attendee One', role: 'attendee' },
  { email: 'attendee2@example.com', name: 'Attendee Two', role: 'attendee' },
  { email: 'attendee3@example.com', name: 'Attendee Three', role: 'attendee' },
  { email: 'attendee4@example.com', name: 'Attendee Four', role: 'attendee' },
  { email: 'attendee5@example.com', name: 'Attendee Five', role: 'attendee' },
  { email: 'attendee6@example.com', name: 'Attendee Six', role: 'attendee' },
] as const

const STEPS = [
  'Basics',
  'Venue Maps',
  'Sponsors',
  'Users',
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
  const [prefilling, setPrefilling] = useState(false)
  const [prefillStatus, setPrefillStatus] = useState<string | null>(null)
  const [prefillError, setPrefillError] = useState<string | null>(null)

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

  // Fills the whole wizard with ImpactConnect-themed sample data, including
  // real Auth accounts for admin1/staff1-2/speaker1-3/attendee1-6 (all
  // password "abc123"), so the wizard - and the mobile app afterward - can
  // be demoed/tested end to end without hand-typing everything first.
  async function handlePrefill() {
    if (!draftId) return
    setPrefilling(true)
    setPrefillError(null)
    try {
      const start = new Date()
      start.setDate(start.getDate() + 30)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      setPrefillStatus('Uploading landing GIF…')
      const gifBlob = await (await fetch('/tmp.gif')).blob()
      const gifFile = new File([gifBlob], 'tmp.gif', { type: 'image/gif' })
      const landingGifUrl = await uploadEventContentImage(
        `landing-gif/${draftId}-prefill.gif`,
        gifFile
      )

      setPrefillStatus('Filling in event details…')
      await handleChange({
        name: 'ImpactConnect Summit 2026',
        description:
          'ImpactConnect Summit brings together NGO staff, volunteers, partner organizations and student changemakers for two days of workshops, panels and networking focused on community impact.',
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        location: 'Riverside Convention Center',
        venue: 'Riverside Convention Center, Hall A',
        address: '1 Riverside Way, Springfield',
        website: 'https://impactconnect.example.com',
        organizer: {
          name: 'ImpactConnect Foundation',
          email: 'organizer@impactconnect.example.com',
          phone: '+1 555-0100',
        },
        themes: ['Community Impact', 'Youth Empowerment', 'Sustainable Giving'],
        hashtags: ['ImpactConnect2026', 'CommunityFirst'],
        socialMedia: {
          twitter: '@impactconnect',
          linkedin: 'impactconnect',
          instagram: '@impactconnect',
          youtube: 'ImpactConnect',
        },
        landingGifUrl,
      })

      setPrefillStatus('Creating demo users…')
      const speakerUids: Record<string, string> = {}
      for (const u of DEMO_USERS) {
        const result = await addUser({
          email: u.email,
          password: DEMO_PASSWORD,
          name: u.name,
          role: u.role,
        })
        const uid = (result.data as { uid: string }).uid
        if (u.role === 'speaker') {
          speakerUids[u.email] = uid
          await updateDoc(doc(db, 'users', uid), {
            title: 'title' in u ? u.title : '',
            company: 'company' in u ? u.company : '',
          })
        }
      }

      setPrefillStatus('Creating sponsors…')
      const sponsorContact = { name: '', email: '', phone: '' }
      const [sponsor1] = await Promise.all([
        addDoc(collection(db, 'sponsors'), {
          eventId: draftId,
          name: 'ImpactConnect Foundation',
          logoUrl: '',
          website: '',
          description: 'Lead organizer and founding partner.',
          tier: 'platinum',
          contact: sponsorContact,
        }),
        addDoc(collection(db, 'sponsors'), {
          eventId: draftId,
          name: 'Northstar Youth Alliance',
          logoUrl: '',
          website: '',
          description: 'Youth engagement partner.',
          tier: 'gold',
          contact: sponsorContact,
        }),
        addDoc(collection(db, 'sponsors'), {
          eventId: draftId,
          name: 'Bright Futures Collective',
          logoUrl: '',
          website: '',
          description: 'Research and grants partner.',
          tier: 'silver',
          contact: sponsorContact,
        }),
      ])

      setPrefillStatus('Creating venue maps…')
      await addDoc(collection(db, 'events', draftId, 'venueMaps'), {
        title: 'Main Hall - Ground Floor',
        floor: 'Ground Floor',
        description: 'Keynotes, panels and the main networking area.',
        imageUrls: [],
        order: 0,
      })
      await addDoc(collection(db, 'events', draftId, 'venueMaps'), {
        title: 'Breakout Rooms - Second Floor',
        floor: '2nd Floor',
        description: 'Workshop rooms A-D.',
        imageUrls: [],
        order: 1,
      })

      setPrefillStatus('Creating sessions…')
      const speaker1 = speakerUids['speaker1@example.com']
      const speaker2 = speakerUids['speaker2@example.com']
      const speaker3 = speakerUids['speaker3@example.com']

      const sessionAt = (dayOffset: number, hour: number, durationMins: number) => {
        const s = new Date(start)
        s.setDate(s.getDate() + dayOffset)
        s.setHours(hour, 0, 0, 0)
        return {
          startTime: Timestamp.fromDate(s),
          endTime: Timestamp.fromDate(new Date(s.getTime() + durationMins * 60000)),
        }
      }
      const sessionDefaults = {
        eventId: draftId,
        description: '',
        liveStreamUrl: '',
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
      }
      const demoSessions = [
        {
          title: 'Opening Keynote: The Future of Community Impact',
          location: 'Main Hall',
          speakerIds: [speaker1].filter(Boolean),
          priority: 5,
          partnerId: sponsor1.id,
          capacity: 200,
          ...sessionAt(0, 9, 60),
        },
        {
          title: 'Workshop: Grassroots Fundraising 101',
          location: 'Breakout Room A',
          speakerIds: [speaker2].filter(Boolean),
          priority: 2,
          partnerId: '',
          capacity: 40,
          ...sessionAt(0, 11, 90),
        },
        {
          title: 'Panel: Youth-Led Change',
          location: 'Main Hall',
          speakerIds: [speaker2, speaker3].filter(Boolean),
          priority: 4,
          partnerId: '',
          capacity: 100,
          ...sessionAt(0, 14, 60),
        },
        {
          title: 'Networking Lunch & Partner Showcase',
          location: 'Atrium',
          speakerIds: [],
          priority: 3,
          partnerId: sponsor1.id,
          capacity: 0,
          ...sessionAt(1, 12, 90),
        },
        {
          title: 'Closing Remarks & Impact Awards',
          location: 'Main Hall',
          speakerIds: [speaker1].filter(Boolean),
          priority: 5,
          partnerId: '',
          capacity: 200,
          ...sessionAt(1, 16, 45),
        },
      ]
      for (const s of demoSessions) {
        await addDoc(collection(db, 'sessions'), { ...sessionDefaults, ...s })
      }
    } catch (e) {
      setPrefillError(e instanceof Error ? e.message : 'Failed to prefill demo data.')
    } finally {
      setPrefilling(false)
      setPrefillStatus(null)
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
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrefill}
            disabled={prefilling || launching}
            className="rounded border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 disabled:opacity-40"
            title="Fills every step with ImpactConnect-themed sample data and creates demo accounts (password: abc123)"
          >
            {prefilling ? prefillStatus ?? 'Prefilling…' : 'Prefill Demo Data'}
          </button>
          <button
            onClick={handleLaunch}
            disabled={!canLaunch || launching}
            className="rounded bg-green-700 text-white text-sm font-medium px-4 py-2 hover:bg-green-800 disabled:opacity-40"
            title={canLaunch ? '' : 'Fill in name, dates, and location first'}
          >
            {launching ? 'Launching…' : 'Launch Event'}
          </button>
        </div>
      </div>
      {launchError && <p className="text-sm text-red-600 mb-4">{launchError}</p>}
      {prefillError && <p className="text-sm text-red-600 mb-4">{prefillError}</p>}

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
        {step === 1 && (
          <StepVenueMaps draftId={draftId} draft={draft} onChange={handleChange} />
        )}
        {step === 2 && <StepSponsors draftId={draftId} />}
        {step === 3 && <StepUsers />}
        {step === 4 && <StepSpeakers />}
        {step === 5 && <StepSessions draftId={draftId} />}
        {step === 6 && <StepFeatureFlags />}
      </div>
    </div>
  )
}
