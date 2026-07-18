// Mirrors lib/core/models/event_model.dart's fields (plus status/isActive,
// which the mobile app's Event model doesn't parse status from but does
// read isActive from).
export interface DraftEvent {
  name: string
  description: string
  startDate: string // yyyy-MM-dd, converted to Timestamp on save
  endDate: string
  location: string
  isActive: boolean
  venueMapUrl: string
  imageUrls: string[]
  venue: string
  address: string
  website: string
  organizer: { name: string; email: string; phone: string }
  themes: string[]
  hashtags: string[]
  socialMedia: {
    twitter: string
    linkedin: string
    instagram: string
    youtube: string
  }
  status: 'draft' | 'published'
}

export const emptyDraftEvent: DraftEvent = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  isActive: false,
  venueMapUrl: '',
  imageUrls: [],
  venue: '',
  address: '',
  website: '',
  organizer: { name: '', email: '', phone: '' },
  themes: [],
  hashtags: [],
  socialMedia: { twitter: '', linkedin: '', instagram: '', youtube: '' },
  status: 'draft',
}

// Mirrors lib/core/models/venue_map_model.dart.
export interface VenueMapEntry {
  id: string
  title: string
  description: string
  floor: string
  imageUrls: string[]
  order: number
}

// Mirrors lib/core/models/sponsor_model.dart.
export interface SponsorEntry {
  id: string
  eventId: string
  name: string
  logoUrl: string
  website: string
  description: string
  tier: '' | 'platinum' | 'gold' | 'silver'
  contactName: string
  contactEmail: string
  contactPhone: string
}

// A speaker is a real users/{uid} doc with role: 'speaker', created via
// the superAdminAddUser Cloud Function (not staged in the draft).
export interface SpeakerEntry {
  uid: string
  name: string
  email: string
  title: string
  company: string
  bio: string
  profileImageUrl: string
}

// Mirrors lib/core/models/session_model.dart's creation-relevant fields.
export interface SessionEntry {
  id: string
  eventId: string
  title: string
  description: string
  startTime: string // yyyy-MM-ddTHH:mm
  endTime: string
  location: string
  speakerIds: string[]
  liveStreamUrl: string
  capacity: number
}

export const REMOTE_CONFIG_FLAGS = [
  {
    key: 'is_chat_enabled',
    label: 'Session chat',
    description: 'Live chat, QR check-in and analytics for sessions.',
    default: true,
  },
  {
    key: 'is_leaderboard_enabled',
    label: 'Leaderboard',
    description: 'Points and the public leaderboard screen.',
    default: false,
  },
  {
    key: 'is_auto_approve_registration_enabled',
    label: 'Auto-approve registrations',
    description: 'New sign-ups skip admin approval and start as approved.',
    default: false,
  },
  {
    key: 'is_networking_enabled',
    label: 'Networking',
    description: 'The Networking tab, directories and QR connections.',
    default: true,
  },
  {
    key: 'is_meetings_enabled',
    label: '1:1 meetings',
    description: 'Meeting requests and scheduling.',
    default: true,
  },
] as const
