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
      <div className="text-sm text-slate-500 rounded border border-slate-200 bg-slate-50 p-3 space-y-1">
        <p>
          Published immediately here, but the mobile app only checks for
          new values once per cold start (fully closed and reopened,
          not just backgrounded) and won't check again until{' '}
          <strong>12 hours</strong> have passed since its last check - so
          most users won't see a change until both of those line up.
        </p>
        <p>
          Exception: whether points get <em>awarded</em> for leaderboard
          actions is decided server-side and reacts within ~5 minutes.
          That's just the awarding logic, though - the Leaderboard tab
          itself still follows the same 12-hour/cold-start rule as every
          other flag above.
        </p>
      </div>
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
