import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { ref, getDownloadURL } from 'firebase/storage'
import { functions, storage } from '../../lib/firebase'

const generateExport = httpsCallable(functions, 'superAdminGenerateEventExport')
const wipeEvent = httpsCallable(functions, 'superAdminWipeEvent')

interface ExportResult {
  jsonPath: string
  csvPath: string
  summary: Record<string, unknown>
}

interface Props {
  eventId: string
}

export function EndEventPanel({ eventId }: Props) {
  const [generating, setGenerating] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [downloadUrls, setDownloadUrls] = useState<{ json: string; csv: string } | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  const [wiping, setWiping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateExport({ eventId })
      const data = result.data as ExportResult
      setExportResult(data)
      const [json, csv] = await Promise.all([
        getDownloadURL(ref(storage, data.jsonPath)),
        getDownloadURL(ref(storage, data.csvPath)),
      ])
      setDownloadUrls({ json, csv })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate export.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleWipe() {
    if (!downloaded) return
    setWiping(true)
    setError(null)
    try {
      await wipeEvent({ eventId, confirmed: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to end the event.')
      setWiping(false)
    }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h3 className="font-medium text-red-900 mb-1">End Event</h3>
      <p className="text-sm text-red-800 mb-4">
        This generates a downloadable export, then permanently deletes every
        event, session, sponsor, meeting, message, and user account (except
        your own). This cannot be undone.
      </p>

      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}

      {!exportResult && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {generating ? 'Generating export…' : 'Generate export'}
        </button>
      )}

      {exportResult && downloadUrls && (
        <div className="space-y-4">
          <div className="rounded border border-red-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-medium mb-2">Summary</p>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(exportResult.summary, null, 2)}
            </pre>
          </div>
          <div className="flex gap-3">
            <a
              href={downloadUrls.json}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-700 underline"
            >
              Download full export (JSON)
            </a>
            <a
              href={downloadUrls.csv}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-700 underline"
            >
              Download users (CSV)
            </a>
          </div>

          <label className="flex items-center gap-2 text-sm text-red-900">
            <input
              type="checkbox"
              checked={downloaded}
              onChange={(e) => setDownloaded(e.target.checked)}
            />
            I've downloaded the export and understand this cannot be undone.
          </label>

          <button
            onClick={handleWipe}
            disabled={!downloaded || wiping}
            className="rounded bg-red-700 text-white text-sm font-medium px-4 py-2 hover:bg-red-800 disabled:opacity-40"
          >
            {wiping ? 'Ending event…' : 'End event permanently'}
          </button>
        </div>
      )}
    </div>
  )
}
