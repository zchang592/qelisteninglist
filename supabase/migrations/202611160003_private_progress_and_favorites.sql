-- Apply after migrations 001 and 002. Existing progress, statuses and notes are preserved.
begin;

-- A restrictive policy combines with every existing permissive policy, so an older
-- public-read policy cannot accidentally expose the administrator's progress.
create or replace function public.qe_can_read_private_progress()
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null then return false; end if;
  return coalesce(public.am_i_qe_admin(), false);
end;
$$;
revoke all on function public.qe_can_read_private_progress() from public, anon, authenticated;
grant execute on function public.qe_can_read_private_progress() to anon, authenticated;

alter table public.listening_progress enable row level security;
drop policy if exists "Only the administrator can read listening progress" on public.listening_progress;
create policy "Only the administrator can read listening progress"
  on public.listening_progress as restrictive for select to anon, authenticated
  using ((select public.qe_can_read_private_progress()));

create table if not exists public.listening_favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  track_id smallint not null check (track_id between 1 and 160),
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.listening_favorites enable row level security;
revoke all on public.listening_favorites from public, anon, authenticated;
revoke insert (user_id, track_id, created_at), update (user_id, track_id, created_at)
  on public.listening_favorites from public, anon, authenticated;
grant select, delete on public.listening_favorites to authenticated;
grant insert (track_id) on public.listening_favorites to authenticated;

drop policy if exists "Users can read their own favorites" on public.listening_favorites;
create policy "Users can read their own favorites" on public.listening_favorites
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can add their own favorites" on public.listening_favorites;
create policy "Users can add their own favorites" on public.listening_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can remove their own favorites" on public.listening_favorites;
create policy "Users can remove their own favorites" on public.listening_favorites
  for delete to authenticated using (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
commit;
