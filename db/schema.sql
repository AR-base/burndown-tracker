-- ============================================================================
-- Burndown Tracker — Phase 1 database (Supabase / PostgreSQL 15+)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
--
-- Model: users belong to workspaces (one per company / startup) with a role:
--   owner  > pm (project manager) > member > viewer
-- Projects live in a workspace. Clients follow a project through a read-only
-- share link (no account). Every table has row-level security: a user can only
-- ever read or change rows of workspaces they belong to, at their role's level.
-- Sensitive operations (roles, invitations, share links, account deletion) go
-- through SECURITY DEFINER functions that check the caller's role themselves.
-- ============================================================================

-- ---------- types ----------
do $$ begin
  create type public.ws_role as enum ('owner', 'pm', 'member', 'viewer');
exception when duplicate_object then null; end $$;

-- ---------- tables ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at   timestamptz not null default now()
);

create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.ws_role not null default 'member',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists workspace_members_user_idx on public.workspace_members (user_id);

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  data         jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000),
  version      integer not null default 1,
  archived     boolean not null default false,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now()
);
create index if not exists projects_ws_idx on public.projects (workspace_id, archived, updated_at desc);

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role         public.ws_role not null check (role <> 'owner'),
  token_hash   text not null unique,
  invited_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users (id) on delete set null
);
create index if not exists invitations_ws_idx on public.invitations (workspace_id);

create table if not exists public.project_shares (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  token_hash     text not null unique,
  label          text not null default '' check (char_length(label) <= 80),
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz,
  revoked_at     timestamptz,
  last_viewed_at timestamptz
);
create index if not exists project_shares_project_idx on public.project_shares (project_id);

create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid,               -- no FK: the entry outlives a deleted project
  actor        uuid references auth.users (id) on delete set null,
  action       text not null check (char_length(action) <= 40),
  details      jsonb not null default '{}'::jsonb,
  at           timestamptz not null default now()
);
create index if not exists audit_log_ws_idx on public.audit_log (workspace_id, at desc);

-- ---------- private helpers (not exposed through the API) ----------
create schema if not exists private;

create or replace function private.role_rank(r public.ws_role) returns int
language sql immutable set search_path = '' as $$
  select case r when 'owner' then 4 when 'pm' then 3 when 'member' then 2 when 'viewer' then 1 else 0 end
$$;

create or replace function private.ws_role(ws uuid) returns public.ws_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.workspace_members m where m.workspace_id = ws and m.user_id = (select auth.uid())
$$;

create or replace function private.has_role(ws uuid, min_role public.ws_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.role_rank(private.ws_role(ws)) >= private.role_rank(min_role), false)
$$;

create or replace function private.project_ws(p uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select workspace_id from public.projects where id = p
$$;

create or replace function private.shares_workspace(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.workspace_members a join public.workspace_members b on a.workspace_id = b.workspace_id
                 where a.user_id = (select auth.uid()) and b.user_id = other)
$$;

create or replace function private.new_token() returns text
language sql volatile set search_path = '' as $$
  select encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text, 'UTF8')), 'hex')
$$;

create or replace function private.hash_token(t text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(coalesce(t, ''), 'UTF8')), 'hex')
$$;

create or replace function private.log(ws uuid, proj uuid, act text, det jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (workspace_id, project_id, actor, action, details) values (ws, proj, (select auth.uid()), act, coalesce(det, '{}'::jsonb))
$$;

-- ---------- triggers ----------
-- profile row for every new account
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)), 80))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- projects: server-controlled columns, version bump, immutable workspace, audit
create or replace function private.projects_before() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1; new.created_by := auth.uid(); new.updated_by := auth.uid();
    new.created_at := now(); new.updated_at := now();
  else
    if new.workspace_id is distinct from old.workspace_id then raise exception 'project_workspace_immutable' using errcode = '42501'; end if;
    -- updates made by the database itself (e.g. ON DELETE SET NULL of an author) do not count as edits
    if new.data is not distinct from old.data and new.name is not distinct from old.name and new.archived is not distinct from old.archived then
      return new;
    end if;
    new.id := old.id; new.created_by := old.created_by; new.created_at := old.created_at;
    new.version := old.version + 1; new.updated_by := auth.uid(); new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists projects_before on public.projects;
create trigger projects_before before insert or update on public.projects for each row execute function private.projects_before();

create or replace function private.projects_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recent bigint;
begin
  if tg_op = 'INSERT' then
    perform private.log(new.workspace_id, new.id, 'project.created', jsonb_build_object('name', new.name));
  elsif tg_op = 'DELETE' then
    -- skip when the whole workspace is being deleted
    if exists (select 1 from public.workspaces where id = old.workspace_id) then
      perform private.log(old.workspace_id, old.id, 'project.deleted', jsonb_build_object('name', old.name));
    end if;
  elsif new.data is not distinct from old.data and new.name is not distinct from old.name and new.archived is not distinct from old.archived then
    null;
  elsif new.archived is distinct from old.archived then
    perform private.log(new.workspace_id, new.id, case when new.archived then 'project.archived' else 'project.restored' end, jsonb_build_object('name', new.name));
  else
    -- autosave writes often: fold edits by the same person within 10 minutes into one entry
    select id into recent from public.audit_log
     where project_id = new.id and actor = auth.uid() and action = 'project.updated' and at > now() - interval '10 minutes'
     order by at desc limit 1;
    if recent is not null then
      update public.audit_log set at = now(),
        details = jsonb_build_object('name', new.name, 'edits', coalesce((details ->> 'edits')::int, 1) + 1, 'version', new.version)
      where id = recent;
    else
      perform private.log(new.workspace_id, new.id, 'project.updated', jsonb_build_object('name', new.name, 'edits', 1, 'version', new.version));
    end if;
  end if;
  return null;
end $$;
drop trigger if exists projects_audit on public.projects;
create trigger projects_audit after insert or update or delete on public.projects for each row execute function private.projects_audit();

-- ---------- row-level security ----------
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects          enable row level security;
alter table public.invitations       enable row level security;
alter table public.project_shares    enable row level security;
alter table public.audit_log         enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_workspace(id));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists workspaces_read on public.workspaces;
create policy workspaces_read on public.workspaces for select to authenticated
  using (private.ws_role(id) is not null);
drop policy if exists workspaces_rename on public.workspaces;
create policy workspaces_rename on public.workspaces for update to authenticated
  using (private.has_role(id, 'pm')) with check (private.has_role(id, 'pm'));
drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces for delete to authenticated
  using (private.has_role(id, 'owner'));

drop policy if exists members_read on public.workspace_members;
create policy members_read on public.workspace_members for select to authenticated
  using (private.ws_role(workspace_id) is not null);

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated
  using (private.ws_role(workspace_id) is not null);
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated
  with check (private.has_role(workspace_id, 'member'));
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
  using (private.has_role(workspace_id, 'member')) with check (private.has_role(workspace_id, 'member'));
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated
  using (private.has_role(workspace_id, 'pm'));

drop policy if exists invitations_read on public.invitations;
create policy invitations_read on public.invitations for select to authenticated
  using (private.has_role(workspace_id, 'pm'));
drop policy if exists invitations_cancel on public.invitations;
create policy invitations_cancel on public.invitations for delete to authenticated
  using (private.has_role(workspace_id, 'pm'));

drop policy if exists shares_read on public.project_shares;
create policy shares_read on public.project_shares for select to authenticated
  using (private.has_role(private.project_ws(project_id), 'pm'));

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using (private.ws_role(workspace_id) is not null);

-- ---------- API functions ----------
-- create a workspace and become its owner (one statement, so the creator can read it back)
create or replace function public.create_workspace(ws_name text) returns public.workspaces
language plpgsql security definer set search_path = '' as $$
declare w public.workspaces;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if (select count(*) from public.workspace_members where user_id = auth.uid() and role = 'owner') >= 20 then
    raise exception 'workspace_limit' using errcode = '54000';
  end if;
  insert into public.workspaces (name, created_by) values (btrim(ws_name), auth.uid()) returning * into w;
  insert into public.workspace_members (workspace_id, user_id, role) values (w.id, auth.uid(), 'owner');
  perform private.log(w.id, null, 'workspace.created', jsonb_build_object('name', w.name));
  return w;
end $$;

-- members of a workspace with their display names
create or replace function public.list_members(ws uuid)
returns table (user_id uuid, role public.ws_role, display_name text, email text, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, coalesce(p.display_name, ''),
         case when private.has_role(ws, 'pm') or m.user_id = auth.uid() then u.email::text else null end,
         m.created_at
  from public.workspace_members m
  left join public.profiles p on p.id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.workspace_id = ws and private.ws_role(ws) is not null
  order by private.role_rank(m.role) desc, m.created_at
$$;

-- change a member's role: owners can set any role; PMs can only move people between member and viewer
create or replace function public.set_member_role(ws uuid, target uuid, new_role public.ws_role) returns void
language plpgsql security definer set search_path = '' as $$
declare me public.ws_role := private.ws_role(ws); cur public.ws_role;
begin
  select role into cur from public.workspace_members where workspace_id = ws and user_id = target;
  if me is null or cur is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if me <> 'owner' and not (me = 'pm' and cur in ('member', 'viewer') and new_role in ('member', 'viewer')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if cur = 'owner' and new_role <> 'owner' and (select count(*) from public.workspace_members where workspace_id = ws and role = 'owner') = 1 then
    raise exception 'last_owner' using errcode = '23514';
  end if;
  update public.workspace_members set role = new_role where workspace_id = ws and user_id = target;
  perform private.log(ws, null, 'member.role_changed', jsonb_build_object('user', target, 'from', cur, 'to', new_role));
end $$;

-- remove a member (or leave, when target = yourself)
create or replace function public.remove_member(ws uuid, target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me public.ws_role := private.ws_role(ws); cur public.ws_role;
begin
  select role into cur from public.workspace_members where workspace_id = ws and user_id = target;
  if me is null or cur is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if target <> auth.uid() and not (me = 'owner' or (me = 'pm' and cur in ('member', 'viewer'))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if cur = 'owner' and (select count(*) from public.workspace_members where workspace_id = ws and role = 'owner') = 1 then
    raise exception 'last_owner' using errcode = '23514';
  end if;
  delete from public.workspace_members where workspace_id = ws and user_id = target;
  perform private.log(ws, null, case when target = auth.uid() then 'member.left' else 'member.removed' end, jsonb_build_object('user', target, 'role', cur));
end $$;

-- invite someone by e-mail; returns the one-time token (only its hash is stored)
create or replace function public.create_invitation(ws uuid, invite_email text, invite_role public.ws_role) returns text
language plpgsql security definer set search_path = '' as $$
declare me public.ws_role := private.ws_role(ws); tok text := private.new_token();
begin
  if me is null or private.role_rank(me) < private.role_rank('pm') then raise exception 'forbidden' using errcode = '42501'; end if;
  if invite_role = 'owner' or (me = 'pm' and invite_role = 'pm') then raise exception 'forbidden_role' using errcode = '42501'; end if;
  if (select count(*) from public.invitations where workspace_id = ws and accepted_at is null and expires_at > now()) >= 100 then
    raise exception 'invitation_limit' using errcode = '54000';
  end if;
  insert into public.invitations (workspace_id, email, role, token_hash, invited_by)
  values (ws, lower(btrim(invite_email)), invite_role, private.hash_token(tok), auth.uid());
  perform private.log(ws, null, 'member.invited', jsonb_build_object('email', lower(btrim(invite_email)), 'role', invite_role));
  return tok;
end $$;

-- accept an invitation: the signed-in account's e-mail must match the invited address
create or replace function public.accept_invitation(invite_token text)
returns table (workspace_id uuid, workspace_name text, role public.ws_role)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare inv public.invitations; my_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  select * into inv from public.invitations where token_hash = private.hash_token(invite_token) for update;
  if inv.id is null or inv.accepted_at is not null or inv.expires_at < now() then raise exception 'invitation_invalid' using errcode = 'P0002'; end if;
  if inv.email <> my_email then raise exception 'invitation_wrong_account' using errcode = '42501'; end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (inv.workspace_id, auth.uid(), inv.role)
  on conflict on constraint workspace_members_pkey do update
    set role = case when private.role_rank(excluded.role) > private.role_rank(public.workspace_members.role) then excluded.role else public.workspace_members.role end;
  update public.invitations set accepted_at = now(), accepted_by = auth.uid() where id = inv.id;
  perform private.log(inv.workspace_id, null, 'member.joined', jsonb_build_object('role', inv.role));
  return query select w.id, w.name, m.role from public.workspaces w join public.workspace_members m on m.workspace_id = w.id and m.user_id = auth.uid() where w.id = inv.workspace_id;
end $$;

-- read-only client link for a project; returns the one-time token
create or replace function public.create_share(proj uuid, share_label text default '', valid_days int default null) returns text
language plpgsql security definer set search_path = '' as $$
declare ws uuid := private.project_ws(proj); tok text := private.new_token();
begin
  if ws is null or not private.has_role(ws, 'pm') then raise exception 'forbidden' using errcode = '42501'; end if;
  if (select count(*) from public.project_shares where project_id = proj and revoked_at is null) >= 20 then raise exception 'share_limit' using errcode = '54000'; end if;
  insert into public.project_shares (project_id, token_hash, label, created_by, expires_at)
  values (proj, private.hash_token(tok), left(coalesce(share_label, ''), 80), auth.uid(),
          case when valid_days is null then null else now() + make_interval(days => least(greatest(valid_days, 1), 365)) end);
  perform private.log(ws, proj, 'share.created', jsonb_build_object('label', left(coalesce(share_label, ''), 80), 'days', valid_days));
  return tok;
end $$;

create or replace function public.revoke_share(share_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.project_shares; ws uuid;
begin
  select * into s from public.project_shares where id = share_id;
  ws := private.project_ws(s.project_id);
  if s.id is null or not private.has_role(ws, 'pm') then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.project_shares set revoked_at = now() where id = share_id and revoked_at is null;
  perform private.log(ws, s.project_id, 'share.revoked', jsonb_build_object('label', s.label));
end $$;

-- public: open a shared project (works without an account)
create or replace function public.get_shared_project(share_token text)
returns table (name text, data jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare s public.project_shares;
begin
  if share_token is null or share_token !~ '^[0-9a-f]{64}$' then return; end if;
  select * into s from public.project_shares where token_hash = private.hash_token(share_token);
  if s.id is null or s.revoked_at is not null or (s.expires_at is not null and s.expires_at < now()) then return; end if;
  update public.project_shares set last_viewed_at = now() where id = s.id and (last_viewed_at is null or last_viewed_at < now() - interval '1 minute');
  return query select p.name, p.data, p.updated_at from public.projects p where p.id = s.project_id and not p.archived;
end $$;

-- GDPR: everything personal about the caller
create or replace function public.export_my_data() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at) from auth.users u where u.id = auth.uid()),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'memberships', coalesce((select jsonb_agg(jsonb_build_object('workspace', w.name, 'role', m.role, 'since', m.created_at))
                             from public.workspace_members m join public.workspaces w on w.id = m.workspace_id where m.user_id = auth.uid()), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(jsonb_build_object('at', a.at, 'action', a.action, 'details', a.details) order by a.at desc)
                          from public.audit_log a where a.actor = auth.uid()), '[]'::jsonb))
$$;

-- GDPR: delete the caller's account. Refuses while they are the only owner of a workspace that has other members.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare blocking text;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  select string_agg(w.name, ', ') into blocking
  from public.workspaces w
  where exists (select 1 from public.workspace_members m where m.workspace_id = w.id and m.user_id = auth.uid() and m.role = 'owner')
    and (select count(*) from public.workspace_members m where m.workspace_id = w.id and m.role = 'owner') = 1
    and (select count(*) from public.workspace_members m where m.workspace_id = w.id) > 1;
  if blocking is not null then raise exception 'transfer_ownership_first: %', blocking using errcode = '23514'; end if;
  delete from public.workspaces w
  where exists (select 1 from public.workspace_members m where m.workspace_id = w.id and m.user_id = auth.uid() and m.role = 'owner')
    and (select count(*) from public.workspace_members m where m.workspace_id = w.id) = 1;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- privileges ----------
revoke all on all tables in schema public from anon;
grant usage on schema public to anon, authenticated;
grant usage on schema private to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, delete on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, delete on public.projects to authenticated;
grant insert (workspace_id, name, data, archived) on public.projects to authenticated;
grant update (name, data, archived) on public.projects to authenticated;
grant select, delete on public.invitations to authenticated;
grant select on public.project_shares to authenticated;
grant select on public.audit_log to authenticated;

revoke execute on all functions in schema public from public, anon;
revoke execute on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated;
grant execute on function public.create_workspace(text), public.list_members(uuid), public.set_member_role(uuid, uuid, public.ws_role),
  public.remove_member(uuid, uuid), public.create_invitation(uuid, text, public.ws_role), public.accept_invitation(text),
  public.create_share(uuid, text, int), public.revoke_share(uuid), public.get_shared_project(text),
  public.export_my_data(), public.delete_my_account() to authenticated;
grant execute on function public.get_shared_project(text) to anon;

-- ---------- live updates ----------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'projects') then
    alter publication supabase_realtime add table public.projects;
  end if;
end $$;
