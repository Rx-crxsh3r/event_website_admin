# ImpactConnect Super Admin

Standalone React (Vite + TypeScript + Tailwind) site for creating, running,
and ending events in the ImpactConnect Firebase project. Only an account
with `role: 'super_admin'` in Firestore can sign in - see
`functions/scripts/bootstrapSuperAdmin.js` in the main app repo for how
that account gets created (never through this site itself).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web config values
npm run dev
```

The Firebase web config values (`VITE_FIREBASE_*`) aren't secret - they
identify the project, not authenticate against it. Security comes from
Firestore/Storage rules and the Cloud Functions in `functions/src/superAdmin.ts`,
which independently re-check `role === 'super_admin'` server-side on every
call regardless of what this site's UI allows.

## What this site does

- **No active event**: walks through a 6-step wizard (basics, venue maps,
  sponsors, speakers, sessions, feature flags) that autosaves to a draft
  Firestore doc as you go, then an explicit "Launch Event" step.
- **Active event**: add a user, toggle the 5 mobile-app feature flags live,
  and end the event - which generates a downloadable export, then (after
  an explicit confirmation) permanently wipes all event data and every
  user account except the super admin's own.

## Deploying

This project has no opinion on hosting - build with `npm run build` and
serve the `dist/` folder however you like (e.g. Vercel). It talks to
Firebase over the same JS SDK regardless of where it's served from.
