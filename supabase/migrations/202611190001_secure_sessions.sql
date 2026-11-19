-- Server-only session storage. No existing learner rows are changed.
create table public.bora_web_sessions (
 token_hash text primary key check (length(token_hash)=64),
 user_id uuid not null references auth.users(id) on delete cascade,
 auth_session_id uuid not null,
 encrypted_tokens text not null check (length(encrypted_tokens)<20000),
 purpose text not null default 'normal' check (purpose in ('normal','recovery')),
 expires_at timestamptz not null,
 last_seen_at timestamptz not null default now(),
 lock_owner uuid,
 lock_until timestamptz,
 created_at timestamptz not null default now()
);
alter table public.bora_web_sessions enable row level security;
revoke all on public.bora_web_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.bora_web_sessions to service_role;
create index bora_web_session_user on public.bora_web_sessions(user_id);
create table public.bora_auth_limits (
 bucket text primary key,
 started_at timestamptz not null,
 attempts integer not null
);
alter table public.bora_auth_limits enable row level security;
revoke all on public.bora_auth_limits from public, anon, authenticated;
create function public.bora_auth_limit(p_bucket text,p_limit integer,p_period integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if p_limit<1 or p_limit>1000 or p_period<1 or p_period>86400 or length(p_bucket)>150 then raise exception 'Invalid limit'; end if;
 insert into public.bora_auth_limits(bucket,started_at,attempts) values(p_bucket,now(),1)
 on conflict(bucket) do update set
 attempts=case when bora_auth_limits.started_at<now()-make_interval(secs=>p_period) then 1 else bora_auth_limits.attempts+1 end,
 started_at=case when bora_auth_limits.started_at<now()-make_interval(secs=>p_period) then now() else bora_auth_limits.started_at end
 returning attempts into n;
 delete from public.bora_auth_limits where started_at<now()-interval '2 days';
 return n<=p_limit;
end $$;
revoke all on function public.bora_auth_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.bora_auth_limit(text,integer,integer) to service_role;
create function public.bora_session_active(p_session uuid,p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions where id=p_session and user_id=p_user)
$$;
revoke all on function public.bora_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.bora_session_active(uuid,uuid) to service_role;
create function public.bora_session_lock(p_hash text,p_owner uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare found_hash text;
begin
 update public.bora_web_sessions set lock_owner=p_owner,lock_until=now()+interval '60 seconds'
 where token_hash=p_hash and expires_at>now() and (lock_until is null or lock_until<now()) returning token_hash into found_hash;
 return found_hash is not null;
end $$;
revoke all on function public.bora_session_lock(text,uuid) from public,anon,authenticated;
grant execute on function public.bora_session_lock(text,uuid) to service_role;
-- Client IDs must be explicitly registered before an OAuth token can access the API.
create table public.bora_oauth_clients (
 client_id uuid primary key,
 display_name text not null,
 enabled boolean not null default false,
 permissions text[] not null default array['progress:read']::text[],
 check (permissions<@array['progress:read','progress:write','tutor:use','speech:use']::text[])
);
alter table public.bora_oauth_clients enable row level security;
revoke all on public.bora_oauth_clients from public,anon,authenticated;
grant select,insert,update,delete on public.bora_oauth_clients to service_role;
create function public.bora_client_can(p_permission text) returns boolean
language sql stable security definer set search_path='' as $$
 select case when auth.jwt()->>'client_id' is null then true else exists(
 select 1 from public.bora_oauth_clients where client_id::text=auth.jwt()->>'client_id' and enabled and p_permission=any(permissions)) end
$$;
revoke all on function public.bora_client_can(text) from public,anon;
grant execute on function public.bora_client_can(text) to authenticated;
-- Restrictive policies intersect the existing owner policies; they cannot broaden access.
create policy bora_oauth_read_guard on public.bora_progress as restrictive for select to authenticated using (public.bora_client_can('progress:read'));
create policy bora_oauth_insert_guard on public.bora_progress as restrictive for insert to authenticated with check (public.bora_client_can('progress:write'));
create policy bora_oauth_update_guard on public.bora_progress as restrictive for update to authenticated using (public.bora_client_can('progress:write')) with check (public.bora_client_can('progress:write'));
create policy bora_oauth_delete_guard on public.bora_progress as restrictive for delete to authenticated using ((auth.jwt()->>'client_id') is null);

-- Check only the caller’s own session; no arbitrary user/session lookup is exposed.
create function public.bora_own_session_active() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions where id::text=auth.jwt()->>'session_id' and user_id=auth.uid())
$$;
revoke all on function public.bora_own_session_active() from public,anon;
grant execute on function public.bora_own_session_active() to authenticated;
create policy bora_active_session_guard on public.bora_progress as restrictive for all to authenticated using(public.bora_own_session_active()) with check(public.bora_own_session_active());
