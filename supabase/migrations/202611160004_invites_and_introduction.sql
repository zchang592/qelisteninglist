-- Apply after migrations 001–003. Existing accounts and comments are unchanged.
begin;
create table if not exists public.qe_invites (
  code text primary key,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid
);
alter table public.qe_invites enable row level security;
revoke all on public.qe_invites from public, anon, authenticated;

-- The auth transaction consumes a code atomically. Invalid or reused codes abort signup.
create or replace function public.qe_consume_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare invite text;
begin
  invite := pg_catalog.btrim(coalesce(new.raw_user_meta_data->>'invite_code',''));
  update public.qe_invites set used_at = now(), used_by = new.id
    where code = invite and used_at is null;
  if not found then raise exception 'Invalid or already used invitation code'; end if;
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data,'{}'::jsonb) - 'invite_code';
  return new;
end $$;
revoke all on function public.qe_consume_invite() from public, anon, authenticated;
drop trigger if exists qe_consume_invite on auth.users;
create trigger qe_consume_invite before insert on auth.users for each row execute function public.qe_consume_invite();

-- Seed ten single-use random codes only on the first installation.
insert into public.qe_invites(code)
select replace(gen_random_uuid()::text,'-','') from generate_series(1,10)
where not exists (select 1 from public.qe_invites);

create or replace function public.qe_admin_invites(create_count integer default 0)
returns table(code text, created_at timestamptz, used_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.am_i_qe_admin(),false) then raise exception 'Administrator required' using errcode='42501'; end if;
  if create_count < 0 or create_count > 50 then raise exception 'Count must be between 0 and 50'; end if;
  insert into public.qe_invites(code) select replace(gen_random_uuid()::text,'-','') from generate_series(1,create_count);
  return query select i.code,i.created_at,i.used_at from public.qe_invites i order by i.created_at desc,i.code;
end $$;
revoke all on function public.qe_admin_invites(integer) from public, anon, authenticated;
grant execute on function public.qe_admin_invites(integer) to authenticated;

create table if not exists public.qe_site_introduction (
  id boolean primary key default true check (id),
  content_zh text not null default '', content_en text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.qe_site_introduction(id) values(true) on conflict do nothing;
alter table public.qe_site_introduction enable row level security;
revoke all on public.qe_site_introduction from public, anon, authenticated;
grant select on public.qe_site_introduction to anon, authenticated;
grant update(content_zh, content_en, updated_at) on public.qe_site_introduction to authenticated;
drop policy if exists "Anyone can read site introduction" on public.qe_site_introduction;
create policy "Anyone can read site introduction" on public.qe_site_introduction for select to anon, authenticated using (true);
drop policy if exists "Only administrators can edit site introduction" on public.qe_site_introduction;
create policy "Only administrators can edit site introduction" on public.qe_site_introduction for update to authenticated
  using ((select public.qe_can_read_private_progress())) with check ((select public.qe_can_read_private_progress()));
notify pgrst, 'reload schema';
commit;
