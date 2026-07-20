import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, updateDoc, doc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../lib/firebase'
import { uploadEventContentImage } from '../../lib/storage'
import type { SpeakerEntry } from '../../lib/types'

const addUser = httpsCallable(functions, 'superAdminAddUser')

export function StepSpeakers() {
  const [speakers, setSpeakers] = useState<SpeakerEntry[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [medium, setMedium] = useState('')
  const [instagram, setInstagram] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'speaker'))
    return onSnapshot(q, (snap) => {
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
  }, [])

  async function createSpeaker() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.')
      return
    }
    setError(null)
    setCreating(true)
    try {
      const result = await addUser({
        email: email.trim(),
        password,
        name: name.trim(),
        role: 'speaker',
      })
      const uid = (result.data as { uid: string }).uid
      await updateDoc(doc(db, 'users', uid), {
        title: title.trim(),
        company: company.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        linkedin: linkedin.trim(),
        twitter: twitter.trim(),
        website: website.trim(),
        github: github.trim(),
        medium: medium.trim(),
        instagram: instagram.trim(),
      })
      setName('')
      setEmail('')
      setPassword('')
      setTitle('')
      setCompany('')
      setBio('')
      setPhone('')
      setLinkedin('')
      setTwitter('')
      setWebsite('')
      setGithub('')
      setMedium('')
      setInstagram('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create speaker.')
    } finally {
      setCreating(false)
    }
  }

  async function uploadPhoto(uid: string, file: File) {
    const url = await uploadEventContentImage(
      `speaker-photos/${uid}-${Date.now()}-${file.name}`,
      file
    )
    await updateDoc(doc(db, 'users', uid), { profileImageUrl: url })
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
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
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            placeholder="Shown on the speaker's profile and session cards"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Links (all optional)</p>
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="LinkedIn URL"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Twitter/X URL"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Website URL"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="GitHub URL"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Medium URL"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Instagram URL"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={createSpeaker}
          disabled={creating}
          className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Add speaker'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {speakers.map((s) => (
          <div
            key={s.uid}
            className="flex items-center justify-between rounded border border-slate-200 p-3"
          >
            <div className="flex items-center gap-3">
              {s.profileImageUrl && (
                <img src={s.profileImageUrl} className="h-8 w-8 rounded-full object-cover" />
              )}
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {[s.title, s.company].filter(Boolean).join(' · ') || s.email}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadPhoto(s.uid, file)
                e.target.value = ''
              }}
              className="text-xs"
            />
          </div>
        ))}
        {speakers.length === 0 && (
          <p className="text-sm text-slate-400">No speakers yet.</p>
        )}
      </div>
    </div>
  )
}
