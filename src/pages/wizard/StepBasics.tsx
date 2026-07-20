import { useRef, useState } from 'react'
import type { DraftEvent } from '../../lib/types'
import { uploadEventContentImage } from '../../lib/storage'

interface Props {
  draft: DraftEvent
  onChange: (partial: Partial<DraftEvent>) => void
}

function Field({
  label,
  value,
  onBlurSave,
  type = 'text',
}: {
  label: string
  value: string
  onBlurSave: (value: string) => void
  type?: string
}) {
  const [local, setLocal] = useState(value)
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onBlurSave(local)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  )
}

function ListField({
  label,
  items,
  onSave,
}: {
  label: string
  items: string[]
  onSave: (items: string[]) => void
}) {
  const [input, setInput] = useState('')
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {item}
            <button
              onClick={() => onSave(items.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault()
              onSave([...items, input.trim()])
              setInput('')
            }
          }}
          placeholder="Type and press Enter"
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
    </div>
  )
}

export function StepBasics({ draft, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingGif, setUploadingGif] = useState(false)

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadEventContentImage(
          `hero/${Date.now()}-${file.name}`,
          file
        )
        urls.push(url)
      }
      onChange({ imageUrls: [...draft.imageUrls, ...urls] })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLandingGifUpload(file: File | null | undefined) {
    if (!file) return
    setUploadingGif(true)
    try {
      const url = await uploadEventContentImage(
        `landing-gif/${Date.now()}-${file.name}`,
        file
      )
      onChange({ landingGifUrl: url })
    } finally {
      setUploadingGif(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Event name *"
          value={draft.name}
          onBlurSave={(v) => onChange({ name: v })}
        />
        <Field
          label="Location *"
          value={draft.location}
          onBlurSave={(v) => onChange({ location: v })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          defaultValue={draft.description}
          onBlur={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start date *"
          type="date"
          value={draft.startDate}
          onBlurSave={(v) => onChange({ startDate: v })}
        />
        <Field
          label="End date *"
          type="date"
          value={draft.endDate}
          onBlurSave={(v) => onChange({ endDate: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Venue"
          value={draft.venue}
          onBlurSave={(v) => onChange({ venue: v })}
        />
        <Field
          label="Address"
          value={draft.address}
          onBlurSave={(v) => onChange({ address: v })}
        />
      </div>

      <Field
        label="Website"
        value={draft.website}
        onBlurSave={(v) => onChange({ website: v })}
      />

      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Organizer name"
          value={draft.organizer.name}
          onBlurSave={(v) => onChange({ organizer: { ...draft.organizer, name: v } })}
        />
        <Field
          label="Organizer email"
          value={draft.organizer.email}
          onBlurSave={(v) => onChange({ organizer: { ...draft.organizer, email: v } })}
        />
        <Field
          label="Organizer phone"
          value={draft.organizer.phone}
          onBlurSave={(v) => onChange({ organizer: { ...draft.organizer, phone: v } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ListField
          label="Themes"
          items={draft.themes}
          onSave={(items) => onChange({ themes: items })}
        />
        <ListField
          label="Hashtags"
          items={draft.hashtags}
          onSave={(items) => onChange({ hashtags: items })}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Field
          label="Twitter"
          value={draft.socialMedia.twitter}
          onBlurSave={(v) => onChange({ socialMedia: { ...draft.socialMedia, twitter: v } })}
        />
        <Field
          label="LinkedIn"
          value={draft.socialMedia.linkedin}
          onBlurSave={(v) => onChange({ socialMedia: { ...draft.socialMedia, linkedin: v } })}
        />
        <Field
          label="Instagram"
          value={draft.socialMedia.instagram}
          onBlurSave={(v) => onChange({ socialMedia: { ...draft.socialMedia, instagram: v } })}
        />
        <Field
          label="YouTube"
          value={draft.socialMedia.youtube}
          onBlurSave={(v) => onChange({ socialMedia: { ...draft.socialMedia, youtube: v } })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Attendee/staff home landing GIF
        </label>
        <p className="text-xs text-slate-400 mb-2">
          Replaces the animated banner at the top of the attendee and staff
          home screens. Falls back to the app's bundled default if unset.
        </p>
        {draft.landingGifUrl && (
          <img
            src={draft.landingGifUrl}
            className="h-20 w-full max-w-xs rounded object-cover border border-slate-200 mb-2"
          />
        )}
        <input
          type="file"
          accept="image/gif,image/*"
          disabled={uploadingGif}
          onChange={(e) => {
            handleLandingGifUpload(e.target.files?.[0])
            e.target.value = ''
          }}
          className="text-sm"
        />
        {uploadingGif && <p className="text-xs text-slate-500 mt-1">Uploading…</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Hero images
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {draft.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              className="h-16 w-16 rounded object-cover border border-slate-200"
            />
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleImageUpload(e.target.files)}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-slate-500 mt-1">Uploading…</p>}
      </div>
    </div>
  )
}
