begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('bora-avatars','bora-avatars',false,2097152,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/webp'];
create table public.bora_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 avatar_path text not null,
 updated_at timestamptz not null default now(),
 check(avatar_path=user_id::text||'/avatar.webp')
);
alter table public.bora_profiles enable row level security;
revoke all on public.bora_profiles from public,anon;
grant select,insert,update,delete on public.bora_profiles to authenticated;
create policy bora_profile_owner on public.bora_profiles for all to authenticated
using(user_id=auth.uid() and (auth.jwt()->>'client_id') is null and public.bora_own_session_active())
with check(user_id=auth.uid() and (auth.jwt()->>'client_id') is null and public.bora_own_session_active());
create policy bora_avatar_owner on storage.objects for all to authenticated
using(bucket_id='bora-avatars' and name=auth.uid()::text||'/avatar.webp' and (auth.jwt()->>'client_id') is null and public.bora_own_session_active())
with check(bucket_id='bora-avatars' and name=auth.uid()::text||'/avatar.webp' and (auth.jwt()->>'client_id') is null and public.bora_own_session_active());
-- Prevent any broader storage policy from exposing this private bucket.
create policy bora_avatar_guard on storage.objects as restrictive for all to authenticated
using(bucket_id<>'bora-avatars' or (name=auth.uid()::text||'/avatar.webp' and (auth.jwt()->>'client_id') is null and public.bora_own_session_active()))
with check(bucket_id<>'bora-avatars' or (name=auth.uid()::text||'/avatar.webp' and (auth.jwt()->>'client_id') is null and public.bora_own_session_active()));
commit;
