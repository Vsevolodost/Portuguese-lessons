-- Separate speech budget: replaying a phrase must not consume chat requests.
-- Raw reservation data stays inaccessible; authenticated users may reserve/release only their own leases.
begin;
create table public.bora_speech_reservations (
 id uuid primary key default gen_random_uuid(),
 owner uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '2 minutes')
);
create index bora_speech_created_idx on public.bora_speech_reservations(created_at);
create index bora_speech_owner_created_idx on public.bora_speech_reservations(owner,created_at);
alter table public.bora_speech_reservations enable row level security;
revoke all on public.bora_speech_reservations from public,anon,authenticated;
create function public.bora_speech_acquire() returns jsonb language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); lease uuid; day_start timestamptz := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
begin
 if caller is null then raise insufficient_privilege; end if;
 perform pg_catalog.pg_advisory_xact_lock(72703314);
 delete from public.bora_speech_reservations where created_at < now()-interval '2 days';
 if (select count(*) from public.bora_speech_reservations where owner=caller and created_at>now()-interval '1 minute')>=12 then return '{"allowed":false,"reason":"minute"}'::jsonb; end if;
 if (select count(*) from public.bora_speech_reservations where created_at>=day_start)>=400 then return '{"allowed":false,"reason":"daily"}'::jsonb; end if;
 if (select count(*) from public.bora_speech_reservations where expires_at>now())>=3 then return '{"allowed":false,"reason":"concurrent"}'::jsonb; end if;
 insert into public.bora_speech_reservations(owner) values(caller) returning id into lease;
 return jsonb_build_object('allowed',true,'id',lease);
end $$;
create function public.bora_speech_release(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 update public.bora_speech_reservations set expires_at=now() where id=p_id and owner=auth.uid();
end $$;
revoke all on function public.bora_speech_acquire() from public,anon;
revoke all on function public.bora_speech_release(uuid) from public,anon;
grant execute on function public.bora_speech_acquire() to authenticated;
grant execute on function public.bora_speech_release(uuid) to authenticated;
commit;
