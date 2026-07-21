# Focus Room

Focus Room is a distraction-free study workspace built from the PRD stack:
Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shadcn-style
components, Framer Motion, Zustand, TanStack Query, Supabase, YouTube Data API
v3, pnpm, ESLint, and Prettier.

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`

## Supabase Auth Setup

In Supabase, set these values so auth redirects and emails feel like Focus Room:

- Authentication > URL Configuration > Site URL: your app URL, for local dev use `http://localhost:3000`
- Authentication > URL Configuration > Redirect URLs: add `http://localhost:3000/auth/callback`
- Authentication > Emails > Templates: replace the default Supabase wording with Focus Room copy
- Authentication > Emails > Templates: make the confirmation button link use `{{ .ConfirmationURL }}`
- Project Settings > General: set the project display name to `Focus Room`

If the dev server starts on a different port, add that callback URL too, for
example `http://localhost:3002/auth/callback`.

Run `supabase/migrations/0001_initial_schema.sql` in Supabase to create the
user-owned tables and Row Level Security policies.

## Current Scope

- Landing page with the PRD hero and feature sections
- Supabase Auth forms for email/password and Google OAuth
- Protected dashboard, playlist, workspace, and profile routes
- Focus Workspace with Pomodoro, ambient sound mixer, clean YouTube embed, and
  task manager
- YouTube playlist import route using YouTube Data API v3
- Supabase-backed API routes for tasks and focus session history
