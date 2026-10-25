-- ============================================================================
-- Burndown Tracker — SaaS plans (run AFTER schema.sql; safe to run again)
-- Supabase → SQL Editor → New query → paste → Run.
--
-- Every workspace has a plan: free, pro or team. Limits are enforced here, in
-- the database, so they cannot be bypassed from the browser:
--   free : 3 active projects · 3 people (members + pending invitations) · 1 client link per project
--   pro  : 25 active projects · 10 people · 20 client links per project
--   team : 500 active projects · 50 people · 20 client links per project
-- Owners can start one free 14-day Pro trial per workspace. Only the service role
-- (an admin or a future Stripe webhook) can change the paid plan itself.
-- ============================================================================

alter table public.workspaces add column if not exists plan text not null default 'free';
alter table public.workspaces add column if not exists trial_ends_at timestamptz;
alter table public.workspaces add column if not exists trial_used boolean not null default false;
do $$ begin
  alter table public.workspaces add constraint workspaces_plan_check check (plan in ('free', 'pro', 'team'));
exception when duplicate_object then null; end $$;

-- plan in force today (a running trial counts as pro)
create or replace function private.ws_plan(ws uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case when w.plan = 'free' and w.trial_ends_at > now() then 'pro' else w.plan end from public.workspaces w where w.id = ws
$$;
create or replace function private.plan_limit(p text, what text) returns int
language sql immutable set search_path = '' as $$
  select case what
    when 'projects' then case p when 'team' then 500 when 'pro' then 25 else 3 end
    when 'members'  then case p when 'team' then 50  when 'pro' then 10 else 3 end
    when 'shares'   then case p when 'free' then 1 else 20 end
    else 0 end
$$;
create or replace function private.people_count(ws uuid) returns int
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.workspace_members m where m.workspace_id = ws)::int
       + (select count(*) from public.invitations i where i.workspace_id = ws and i.accepted_at is null and i.expires_at > now())::int
$$;

-- active projects are capped by the plan (new projects, and restoring an archived one)
create or replace function private.projects_plan_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.archived then return new; end if;
  if tg_op = 'UPDATE' and old.archived = false then return new; end if;
  perform 1 from public.workspaces where id = new.workspace_id for update;   -- serialise concurrent creations
  if (select count(*) from public.projects p where p.workspace_id = new.workspace_id and not p.archived and p.id <> new.id)
     >= private.plan_limit(private.ws_plan(new.workspace_id), 'projects') then
    raise exception 'plan_limit_projects' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists projects_plan_guard on public.projects;
create trigger projects_plan_guard before insert or update of archived on public.projects for each row execute function private.projects_plan_guard();

-- people (members + pending invitations) are capped by the plan
create or replace function private.members_plan_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.workspaces where id = new.workspace_id for update;
  if tg_table_name = 'invitations' then
    if private.people_count(new.workspace_id) >= private.plan_limit(private.ws_plan(new.workspace_id), 'members') then
      raise exception 'plan_limit_members' using errcode = '54000';
    end if;
  elsif (select count(*) from public.workspace_members m where m.workspace_id = new.workspace_id)
        >= private.plan_limit(private.ws_plan(new.workspace_id), 'members') then
    raise exception 'plan_limit_members' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists invitations_plan_guard on public.invitations;
create trigger invitations_plan_guard before insert on public.invitations for each row execute function private.members_plan_guard();
drop trigger if exists members_plan_guard on public.workspace_members;
create trigger members_plan_guard before insert on public.workspace_members for each row execute function private.members_plan_guard();

-- client links per project
create or replace function private.shares_plan_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare ws uuid := private.project_ws(new.project_id);
begin
  if (select count(*) from public.project_shares s where s.project_id = new.project_id and s.revoked_at is null and (s.expires_at is null or s.expires_at > now()))
     >= private.plan_limit(private.ws_plan(ws), 'shares') then
    raise exception 'plan_limit_shares' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists shares_plan_guard on public.project_shares;
create trigger shares_plan_guard before insert on public.project_shares for each row execute function private.shares_plan_guard();

-- plan, trial and usage of a workspace (any member)
create or replace function public.workspace_usage(ws uuid)
returns table (plan text, effective_plan text, trial_ends_at timestamptz, trial_used boolean,
               projects int, people int, max_projects int, max_people int, max_shares int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.ws_role(ws) is null then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select w.plan, private.ws_plan(ws), w.trial_ends_at, w.trial_used,
           (select count(*) from public.projects p where p.workspace_id = ws and not p.archived)::int,
           private.people_count(ws),
           private.plan_limit(private.ws_plan(ws), 'projects'), private.plan_limit(private.ws_plan(ws), 'members'), private.plan_limit(private.ws_plan(ws), 'shares')
    from public.workspaces w where w.id = ws;
end $$;

-- one free 14-day Pro trial per workspace, started by its owner
create or replace function public.start_trial(ws uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare ends timestamptz;
begin
  if not private.has_role(ws, 'owner') then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.workspaces set trial_used = true, trial_ends_at = now() + interval '14 days'
   where id = ws and plan = 'free' and not trial_used returning trial_ends_at into ends;
  if ends is null then raise exception 'trial_unavailable' using errcode = '22023'; end if;
  perform private.log(ws, null, 'plan.trial_started', jsonb_build_object('ends', ends));
  return ends;
end $$;

-- the plan columns are never writable from the browser
revoke update on public.workspaces from authenticated;
grant update (name) on public.workspaces to authenticated;
revoke execute on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated;
revoke execute on function public.workspace_usage(uuid), public.start_trial(uuid) from public, anon;
grant execute on function public.workspace_usage(uuid), public.start_trial(uuid) to authenticated;
