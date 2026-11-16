-- Run once in the existing project's Supabase SQL Editor. Safe to run again.
-- Existing listening_progress and administrator activation are left intact.
begin;

create table if not exists public.listening_comments (
  id uuid primary key default gen_random_uuid(),
  track_id smallint not null check (track_id between 1 and 160),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(btrim(body, E' \t\n\r')) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists listening_comments_track_created_idx
  on public.listening_comments (track_id, created_at desc, id desc);
create index if not exists listening_comments_created_idx
  on public.listening_comments (created_at desc, id desc);
create index if not exists listening_comments_user_created_idx
  on public.listening_comments (user_id, created_at desc);

create or replace function public.prepare_listening_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listener uuid := auth.uid();
begin
  if listener is null then
    raise exception '请先登录后发表评论' using errcode = '42501';
  end if;

  -- Take identity from the authenticated session, never from a browser payload.
  new.user_id := listener;
  select left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    '听者 · ' || left(listener::text, 6)), 40)
    into new.author_name from auth.users u where u.id = listener;
  if new.author_name is null then
    raise exception '登录账号不存在，请重新登录' using errcode = '42501';
  end if;

  -- Serialise submissions from one account so concurrent requests cannot bypass the limit.
  perform pg_advisory_xact_lock(hashtextextended(listener::text, 0));
  if exists (select 1 from public.listening_comments c
    where c.user_id = listener and c.created_at > clock_timestamp() - interval '15 seconds') then
    raise exception '请稍等 15 秒再发布下一条评论' using errcode = 'P0001';
  end if;
  new.body := btrim(new.body, E' \t\n\r');
  new.created_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function public.prepare_listening_comment() from public, anon, authenticated;
drop trigger if exists prepare_listening_comment on public.listening_comments;
create trigger prepare_listening_comment before insert on public.listening_comments
  for each row execute function public.prepare_listening_comment();

alter table public.listening_comments enable row level security;
revoke all on public.listening_comments from public, anon, authenticated;
grant select on public.listening_comments to anon, authenticated;
grant insert (track_id, body) on public.listening_comments to authenticated;
grant delete on public.listening_comments to authenticated;

drop policy if exists "Anyone can read listening comments" on public.listening_comments;
create policy "Anyone can read listening comments" on public.listening_comments
  for select to anon, authenticated using (true);
drop policy if exists "Listeners can post their own comments" on public.listening_comments;
create policy "Listeners can post their own comments" on public.listening_comments
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Listeners can delete their own comments" on public.listening_comments;
create policy "Listeners can delete their own comments" on public.listening_comments
  for delete to authenticated using (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
commit;
