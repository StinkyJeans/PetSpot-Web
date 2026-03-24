## PetSpot

PetSpot is a social web app for dog owners and dog lovers, built with Next.js,
Supabase, Tailwind CSS, and griddy-icons.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill in your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. In your Supabase project, run the SQL migrations in:

- `supabase/migrations/202603240001_create_pet_profiles.sql`
- `supabase/migrations/202603240002_create_posts.sql`
- `supabase/migrations/202603240003_storage_and_media.sql`
- `supabase/migrations/202603240004_post_engagement.sql` (likes, comments, shares on posts)
- `supabase/migrations/202603240005_profile_about_follows.sql` (about/details fields, follower counts)
- `supabase/migrations/202603240006_unify_profile_columns.sql` (owner name, pet birthday, favorite place; migrates legacy `birthday` → `pet_birthday`)
- `supabase/migrations/202603240007_pet_profiles_public_read.sql` (read profiles in feed / joins)

**Profile model:** The `pet_profiles` table is one row per user combining **you + your primary pet** (owner fields + pet fields). The UI treats it as a single social profile.

4. In Supabase Auth settings:

- Add Google provider credentials.
- Set the Site URL to `http://localhost:3000`.
- Add `http://localhost:3000/auth/callback` to redirect URLs.

5. Start development server:

```bash
npm run dev
```

## Milestone 1 Implemented

- Email/password signup and login
- Google OAuth login
- Auth callback handling
- Route protection using `src/proxy.js` (Next.js 16 proxy convention)
- Required primary pet profile onboarding
- Protected feed placeholder route
- Feed media uploads (image/video) via Supabase Storage
- Profile and background image uploads with history tracking
# PetSpot-Web
