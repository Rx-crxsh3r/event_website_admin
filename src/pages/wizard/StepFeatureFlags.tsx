import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase'
import { REMOTE_CONFIG_FLAGS } from '../../lib/types'

const setFlag = httpsCallable(functions, 'superAdminSetRemoteConfigFlag')

export function StepFeatureFlags() {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(REMOTE_CONFIG_FLAGS.map((f) => [f.key, f.default]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(key: string, value: boolean) {
    setSaving(key)
    setError(null)
    setValues((prev) => ({ ...prev, [key]: value }))
    try {
      await setFlag({ flagName: key, value })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update flag.')
      setValues((prev) => ({ ...prev, [key]: !value }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        These take effect immediately on the mobile app (after its next
        Remote Config fetch) - not just at launch.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {REMOTE_CONFIG_FLAGS.map((flag) => (
        <label
          key={flag.key}
          className="flex items-center justify-between rounded border border-slate-200 p-4 cursor-pointer"
        >
          <div>
            <p className="font-medium text-slate-900">{flag.label}</p>
            <p className="text-xs text-slate-500">{flag.description}</p>
          </div>
          <input
            type="checkbox"
            checked={values[flag.key]}
            disabled={saving === flag.key}
            onChange={(e) => toggle(flag.key, e.target.checked)}
            className="h-5 w-5"
          />
        </label>
      ))}
    </div>
  )
}
