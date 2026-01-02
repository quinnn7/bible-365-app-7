Supabase integration setup

This project includes a Supabase client at `lib/supabaseClient.js` and client-side calls in `app/page.jsx`.

Before using Supabase features, create a Supabase project and do the following:

1. Set environment variables (in .env.local at project root):

NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

2. Create a table named `profiles` with these columns (SQL):

create table profiles (
  id text primary key,
  email text,
  description text,
  fav_verse text,
  avatar_url text,
  streak integer default 0,
  longest_streak integer default 0,
  completed_days integer default 0
);

3. Create a public storage bucket named `avatars` for profile pictures (toggle public in Supabase Storage settings).

4. Apply the provided SQL migrations in order (use the SQL editor in Supabase):

  - `db/001_create_profiles.sql` (creates `profiles` table and basic RLS policies)
  - `db/002_public_profiles_and_follows.sql` (adds public SELECT policy for `profiles`, creates `follows` table and RLS policies)
  - `db/003_add_consent_fields.sql` (adds `tos_accepted_at`, `privacy_accepted_at`, and `public_profile` to `profiles`)

  These files are included in the repository.

4. (Optional) Set Row Level Security and policies so users can only update their own profile (recommended). For quick testing you may allow open inserts/updates.

5. Install the new dependency and run the dev server:

npm install
npm run dev

Notes
- The code falls back to `localStorage` auth/profile if Supabase is not configured.
- Avatar uploads: when saving a profile, the image (data URL) is uploaded to the `avatars` bucket and `avatar_url` is set to the public URL.
- Authentication uses Supabase Email/Password auth; sign-up will send magic link/email depending on your Supabase settings.

Consent storage

 - The app stores whether a user accepted Terms of Service and Privacy Policy in `profiles.tos_accepted_at` and `profiles.privacy_accepted_at` as timestamps when available. If Supabase is not configured, consent is stored in `localStorage` (`consent.tos` and `consent.privacy`).

Migration order summary:

1. `db/001_create_profiles.sql`
2. `db/002_public_profiles_and_follows.sql`
3. `db/003_add_consent_fields.sql`

Run these via the Supabase SQL editor in that order.

Examples

- Search profiles by username (client-side):

```js
const { data } = await supabase.from('profiles')
  .select('id, username, avatar_url, description')
  .ilike('username', '%query%')
  .limit(20);
```

- Get follower / following counts (server or client with anon key):

```js
const { count: followers } = await supabase.from('follows')
  .select('id', { count: 'exact', head: true })
  .eq('followee_id', userId);

const { count: following } = await supabase.from('follows')
  .select('id', { count: 'exact', head: true })
  .eq('follower_id', userId);
```

- Follow a user (must be authenticated):

```js
await supabase.from('follows').insert({ follower_id: authUser.id, followee_id: targetId });
```

- Unfollow a user (must be authenticated):

```js
await supabase.from('follows').delete().match({ follower_id: authUser.id, followee_id: targetId });
```
