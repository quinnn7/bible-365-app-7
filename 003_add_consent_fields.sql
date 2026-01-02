-- Migration: add consent and visibility fields to profiles
alter table profiles
  add column if not exists tos_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists public_profile boolean default true;

-- You may want to backfill values or update RLS policies to account for `public_profile` when exposing public profiles.
