-- Migration: public profiles select + follows table

-- Create indexes useful for search
create index if not exists idx_profiles_lower_username on profiles (lower(username));
create index if not exists idx_profiles_lower_email on profiles (lower(email));

-- Make profiles selectable publicly (keep existing owner-only update/delete policies)
-- This allows searching and viewing public profiles. Adjust if you want to mask fields.
create policy "Profiles select public" on profiles
for select
using (true);

-- Create follows table to represent follower relationships
create table if not exists follows (
  id bigserial primary key,
  follower_id text not null references profiles(id) on delete cascade,
  followee_id text not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_follow unique (follower_id, followee_id)
);

create index if not exists idx_follows_followee on follows (followee_id);
create index if not exists idx_follows_follower on follows (follower_id);

-- Enable RLS on follows and add policies so users can manage their own follows
alter table follows enable row level security;

create policy "Follows insert by authenticated" on follows
for insert
with check (auth.role() = 'authenticated' and follower_id = auth.uid())
using (auth.role() = 'authenticated');

create policy "Follows delete by follower" on follows
for delete
using (follower_id = auth.uid());

-- Allow select on follows (public), so follower counts can be queried. Adjust if you prefer private follows.
create policy "Follows select public" on follows
for select
using (true);

-- You may want to create materialized views or functions for follower counts and search ranking.
