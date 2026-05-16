-- Kindred Echo - Supabase Schema Setup
-- Project: lvdktsesidqdoaqipjjz
-- Run through the Supabase MCP or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.config_credentials (
  id bigint primary key generated always as identity,
  credential_key text unique not null,
  credential_value text not null,
  is_secret boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consent_accepted_at timestamptz not null,
  loved_one_name text not null,
  relationship text not null,
  family_member_name text not null,
  memory_profile jsonb not null default '{}'::jsonb,
  transcript_text text[] not null default array[]::text[],
  is_private boolean not null default true,
  owner_id uuid references auth.users(id) on delete set null
);

create table if not exists public.voice_clones (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.family_rooms(id) on delete cascade,
  voice_id text unique not null,
  source_file_id bigint not null,
  prompt_file_id bigint,
  cloned_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  model_used_for_warmup text not null default 'speech-2.6-turbo',
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.family_rooms(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  audio_clip_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exported_memories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.family_rooms(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  audio_url text not null,
  text_content text not null,
  model_used text not null default 'speech-2.6-hd',
  exported_at timestamptz not null default now(),
  expires_at timestamptz,
  is_public boolean not null default false
);

create table if not exists public.credential_access_logs (
  id bigint primary key generated always as identity,
  credential_key text not null,
  accessed_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null default 'read',
  success boolean not null default true,
  error_message text
);

create index if not exists idx_config_credentials_key on public.config_credentials(credential_key);
create index if not exists idx_family_rooms_owner on public.family_rooms(owner_id);
create index if not exists idx_family_rooms_created_at on public.family_rooms(created_at desc);
create index if not exists idx_voice_clones_room_id on public.voice_clones(room_id);
create index if not exists idx_voice_clones_voice_id on public.voice_clones(voice_id);
create index if not exists idx_chat_messages_room_id_created_at on public.chat_messages(room_id, created_at);
create index if not exists idx_exported_memories_room_id on public.exported_memories(room_id);
create index if not exists idx_exported_memories_expires_at on public.exported_memories(expires_at);
create index if not exists idx_access_logs_credential_key on public.credential_access_logs(credential_key);

drop trigger if exists set_config_credentials_updated_at on public.config_credentials;
create trigger set_config_credentials_updated_at
before update on public.config_credentials
for each row execute function public.set_updated_at();

drop trigger if exists set_family_rooms_updated_at on public.family_rooms;
create trigger set_family_rooms_updated_at
before update on public.family_rooms
for each row execute function public.set_updated_at();

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
before update on public.chat_messages
for each row execute function public.set_updated_at();

alter table public.config_credentials enable row level security;
alter table public.family_rooms enable row level security;
alter table public.voice_clones enable row level security;
alter table public.chat_messages enable row level security;
alter table public.exported_memories enable row level security;
alter table public.credential_access_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'config_credentials' and policyname = 'service_role_full_access') then
    create policy service_role_full_access on public.config_credentials
      for all using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'config_credentials' and policyname = 'authenticated_read_public_config') then
    create policy authenticated_read_public_config on public.config_credentials
      for select using (auth.role() = 'authenticated' and is_secret = false);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_rooms' and policyname = 'owner_full_access_rooms') then
    create policy owner_full_access_rooms on public.family_rooms
      for all using (auth.uid() = owner_id or auth.role() = 'service_role')
      with check (auth.uid() = owner_id or auth.role() = 'service_role');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'voice_clones' and policyname = 'owner_full_access_voice_clones') then
    create policy owner_full_access_voice_clones on public.voice_clones
      for all using (
        exists (
          select 1 from public.family_rooms
          where family_rooms.id = voice_clones.room_id
          and (family_rooms.owner_id = auth.uid() or auth.role() = 'service_role')
        )
      )
      with check (
        exists (
          select 1 from public.family_rooms
          where family_rooms.id = voice_clones.room_id
          and (family_rooms.owner_id = auth.uid() or auth.role() = 'service_role')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'owner_full_access_chat_messages') then
    create policy owner_full_access_chat_messages on public.chat_messages
      for all using (
        exists (
          select 1 from public.family_rooms
          where family_rooms.id = chat_messages.room_id
          and (family_rooms.owner_id = auth.uid() or auth.role() = 'service_role')
        )
      )
      with check (
        exists (
          select 1 from public.family_rooms
          where family_rooms.id = chat_messages.room_id
          and (family_rooms.owner_id = auth.uid() or auth.role() = 'service_role')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exported_memories' and policyname = 'owner_full_access_exported_memories') then
    create policy owner_full_access_exported_memories on public.exported_memories
      for all using (
        exists (
          select 1 from public.family_rooms
          where family_rooms.id = exported_memories.room_id
          and (family_rooms.owner_id = auth.uid() or auth.role() = 'service_role')
        )
      )
      with check (
        exists (
          select 1 from public.family_rooms
          where family_rooms.id = exported_memories.room_id
          and (family_rooms.owner_id = auth.uid() or auth.role() = 'service_role')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'credential_access_logs' and policyname = 'service_role_only_access_logs') then
    create policy service_role_only_access_logs on public.credential_access_logs
      for all using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
