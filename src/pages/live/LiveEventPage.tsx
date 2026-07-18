import { AddUserPanel } from './AddUserPanel'
import { EndEventPanel } from './EndEventPanel'
import { StepFeatureFlags } from '../wizard/StepFeatureFlags'

interface Props {
  eventId: string
  eventName: string
}

export function LiveEventPage({ eventId, eventName }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{eventName}</h2>
        <p className="text-sm text-slate-500">Live</p>
      </div>

      <AddUserPanel />

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-medium text-slate-900 mb-4">Feature flags</h3>
        <StepFeatureFlags />
      </div>

      <EndEventPanel eventId={eventId} />
    </div>
  )
}
