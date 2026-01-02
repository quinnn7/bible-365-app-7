-- Migration: create profiles table and enable RLS

create table if not exists profiles (
  id text primary key,
  email text,
  username text,
  description text,
  fav_verse text,
  avatar_url text,
  streak integer default 0,
  longest_streak integer default 0,
  completed_days integer default 0,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure updated_at is set automatically
create or replace function set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp_trigger
before update on profiles
for each row execute function set_timestamp();

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policy: allow authenticated users to insert their own profile (id must equal auth.uid())
create policy "Profiles insert if owner" on profiles
for insert
using (auth.role() = 'authenticated' and auth.uid() = id)
with check (auth.role() = 'authenticated' and auth.uid() = id);

-- Policy: allow authenticated users to select their own profile
create policy "Profiles select owned" on profiles
for select
using (auth.uid() = id);

-- Policy: allow authenticated users to update their own profile
create policy "Profiles update owned" on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optionally allow authenticated users to delete their own profile (comment out if not desired)
create policy "Profiles delete owned" on profiles
for delete
using (auth.uid() = id);
