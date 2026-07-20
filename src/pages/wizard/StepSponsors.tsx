import { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { uploadEventContentImage } from '../../lib/storage'
import type { SponsorEntry } from '../../lib/types'

interface Props {
  draftId: string
}

const TIERS = ['', 'platinum', 'gold', 'silver'] as const

export function StepSponsors({ draftId }: Props) {
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([])
  const [name, setName] = useState('')
  const [tier, setTier] = useState<(typeof TIERS)[number]>('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'sponsors'), where('eventId', '==', draftId))
    return onSnapshot(q, (snap) => {
      setSponsors(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SponsorEntry, 'id'>) }))
      )
    })
  }, [draftId])

  async function addSponsor() {
    if (!name.trim()) return
    let logoUrl = ''
    if (logoFile) {
      logoUrl = await uploadEventContentImage(
        `sponsors/${draftId}/${Date.now()}-${logoFile.name}`,
        logoFile
      )
    }
    await addDoc(collection(db, 'sponsors'), {
      eventId: draftId,
      name: name.trim(),
      logoUrl,
      website: website.trim(),
      description: description.trim(),
      tier: tier || '',
      contact: {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
      },
    })
    setName('')
    setTier('')
    setWebsite('')
    setDescription('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setLogoFile(null)
  }

  async function removeSponsor(id: string) {
    await deleteDoc(doc(db, 'sponsors', id))
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sponsor name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as (typeof TIERS)[number])}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t || 'None'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Website
          </label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact name
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact email
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              type="email"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact phone
            </label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Logo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>

        <button
          onClick={addSponsor}
          className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
        >
          Add sponsor
        </button>
      </div>

      <div className="space-y-2">
        {sponsors.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded border border-slate-200 p-3"
          >
            <div className="flex items-center gap-3">
              {s.logoUrl && (
                <img src={s.logoUrl} className="h-8 w-8 rounded object-cover" />
              )}
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {[s.tier, s.website].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeSponsor(s.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        {sponsors.length === 0 && (
          <p className="text-sm text-slate-400">No sponsors yet.</p>
        )}
      </div>
    </div>
  )
}
