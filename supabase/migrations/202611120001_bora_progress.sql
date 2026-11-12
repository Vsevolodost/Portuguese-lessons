-- Dedicated Bora project only. No changes to existing unrelated applications.
create table public.bora_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 500000),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.bora_progress enable row level security;
revoke all on public.bora_progress from anon;
grant select, insert, update, delete on public.bora_progress to authenticated;
create policy bora_owner_select on public.bora_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy bora_owner_insert on public.bora_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy bora_owner_update on public.bora_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy bora_owner_delete on public.bora_progress for delete to authenticated using ((select auth.uid()) = user_id);
-- Optimistic revisions prevent one browser silently overwriting another.
create function public.bora_revision_guard() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.user_id <> old.user_id then raise exception 'Owner cannot change'; end if;
 new.revision := old.revision + 1;
 new.updated_at := now();
 return new;
end;
$$;
create trigger bora_progress_revision before update on public.bora_progress for each row execute function public.bora_revision_guard();
revoke all on function public.bora_revision_guard() from public, anon, authenticated;
