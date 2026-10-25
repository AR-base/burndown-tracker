-- ============================================================================
-- The Manager — Stripe billing columns (run AFTER schema.sql and saas.sql; safe to run again)
-- Only the Stripe webhook (service role) writes these; the browser can only read them.
-- ============================================================================
alter table public.workspaces add column if not exists stripe_customer_id text;
alter table public.workspaces add column if not exists stripe_subscription_id text;
alter table public.workspaces add column if not exists subscription_status text;
alter table public.workspaces add column if not exists plan_renews_at timestamptz;
create unique index if not exists workspaces_stripe_customer_idx on public.workspaces (stripe_customer_id) where stripe_customer_id is not null;

-- usage now also tells the app whether a paid subscription exists (to show "Manage subscription")
drop function if exists public.workspace_usage(uuid);
create or replace function public.workspace_usage(ws uuid)
returns table (plan text, effective_plan text, trial_ends_at timestamptz, trial_used boolean,
               projects int, people int, max_projects int, max_people int, max_shares int,
               subscription_status text, plan_renews_at timestamptz, has_billing boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.ws_role(ws) is null then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select w.plan, private.ws_plan(ws), w.trial_ends_at, w.trial_used,
           (select count(*) from public.projects p where p.workspace_id = ws and not p.archived)::int,
           private.people_count(ws),
           private.plan_limit(private.ws_plan(ws), 'projects'), private.plan_limit(private.ws_plan(ws), 'members'), private.plan_limit(private.ws_plan(ws), 'shares'),
           w.subscription_status, w.plan_renews_at, w.stripe_customer_id is not null
    from public.workspaces w where w.id = ws;
end $$;
revoke execute on function public.workspace_usage(uuid) from public, anon;
grant execute on function public.workspace_usage(uuid) to authenticated;
-- the Stripe ids are not secrets, but nobody needs them in the browser
revoke select on public.workspaces from authenticated;
grant select (id, name, created_by, created_at, plan, trial_ends_at, trial_used) on public.workspaces to authenticated;
