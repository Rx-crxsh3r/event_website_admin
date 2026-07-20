import { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { uploadEventContentImage } from '../../lib/storage'
import type { DraftEvent, VenueMapEntry } from '../../lib/types'

interface Props {
  draftId: string
  draft: DraftEvent
  onChange: (partial: Partial<DraftEvent>) => void
}

export function StepVenueMaps({ draftId, draft, onChange }: Props) {
  const [maps, setMaps] = useState<VenueMapEntry[]>([])
  const [title, setTitle] = useState('')
  const [floor, setFloor] = useState('')
  const [description, setDescription] = useState('')
  const [uploadingPrimary, setUploadingPrimary] = useState(false)

  async function handlePrimaryMapUpload(file: File | null | undefined) {
    if (!file) return
    setUploadingPrimary(true)
    try {
      const url = await uploadEventContentImage(
        `venue-maps/${draftId}/primary-${Date.now()}-${file.name}`,
        file
      )
      onChange({ venueMapUrl: url })
    } finally {
      setUploadingPrimary(false)
    }
  }

  useEffect(() => {
    const q = query(
      collection(db, 'events', draftId, 'venueMaps'),
      orderBy('order')
    )
    return onSnapshot(q, (snap) => {
      setMaps(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VenueMapEntry, 'id'>) }))
      )
    })
  }, [draftId])

  async function addMap() {
    if (!title.trim()) return
    await addDoc(collection(db, 'events', draftId, 'venueMaps'), {
      title: title.trim(),
      floor: floor.trim(),
      description: description.trim(),
      imageUrls: [],
      order: maps.length,
    })
    setTitle('')
    setFloor('')
    setDescription('')
  }

  async function removeMap(id: string) {
    await deleteDoc(doc(db, 'events', draftId, 'venueMaps', id))
  }

  async function addImage(mapId: string, file: File) {
    const url = await uploadEventContentImage(
      `venue-maps/${draftId}/${Date.now()}-${file.name}`,
      file
    )
    const map = maps.find((m) => m.id === mapId)
    if (!map) return
    await updateDoc(doc(db, 'events', draftId, 'venueMaps', mapId), {
      imageUrls: [...map.imageUrls, url],
    })
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Primary venue map
        </label>
        <p className="text-xs text-slate-400 mb-2">
          The single overview map shown on the event's About page - separate
          from the detailed per-floor maps below.
        </p>
        {draft.venueMapUrl && (
          <img
            src={draft.venueMapUrl}
            className="h-24 w-24 rounded object-cover border border-slate-200 mb-2"
          />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploadingPrimary}
          onChange={(e) => {
            handlePrimaryMapUpload(e.target.files?.[0])
            e.target.value = ''
          }}
          className="text-sm"
        />
        {uploadingPrimary && <p className="text-xs text-slate-500 mt-1">Uploading…</p>}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Map title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Floor
          </label>
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="border-b border-slate-200 pb-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={addMap}
          className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
        >
          Add map
        </button>
      </div>

      <div className="space-y-3">
        {maps.map((map) => (
          <div key={map.id} className="rounded border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900">{map.title}</p>
                {map.floor && <p className="text-xs text-slate-500">{map.floor}</p>}
              </div>
              <button
                onClick={() => removeMap(map.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {map.imageUrls.map((url) => (
                <img key={url} src={url} className="h-16 w-16 rounded object-cover border border-slate-200" />
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) addImage(map.id, file)
                e.target.value = ''
              }}
              className="text-sm"
            />
          </div>
        ))}
        {maps.length === 0 && (
          <p className="text-sm text-slate-400">No venue maps yet.</p>
        )}
      </div>
    </div>
  )
}
