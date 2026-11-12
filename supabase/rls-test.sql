-- Transactional isolation test. Test users and progress are rolled back.
begin;
insert into auth.users(id) values ('d3310000-0000-4000-8000-000000000001'),('d3310000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"d3310000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 insert into public.bora_progress(user_id,state) values ('d3310000-0000-4000-8000-000000000001','{"name":"Test A"}');
 update public.bora_progress set state='{"name":"Updated A"}' where user_id='d3310000-0000-4000-8000-000000000001' and revision=1;
 if (select revision from public.bora_progress) <> 2 then raise exception 'revision failed'; end if;
 update public.bora_progress set state='{"name":"Stale"}' where user_id='d3310000-0000-4000-8000-000000000001' and revision=1;
 if (select state->>'name' from public.bora_progress) <> 'Updated A' then raise exception 'stale overwrite'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"d3310000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.bora_progress) then raise exception 'cross-user read'; end if;
 update public.bora_progress set state='{}' where user_id='d3310000-0000-4000-8000-000000000001';
 if found then raise exception 'cross-user update'; end if;
 begin
  insert into public.bora_progress(user_id,state) values ('d3310000-0000-4000-8000-000000000001','{}');
  raise exception 'cross-user insert allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS: owner isolation, revisions and conflict protection; test data rolled back' as result;
