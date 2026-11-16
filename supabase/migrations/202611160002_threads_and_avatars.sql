-- Apply after 202611160001. This preserves existing comments and removes the old 15-second limit.
begin;

alter table public.listening_comments
  add column if not exists parent_id uuid,
  add column if not exists reply_to_id uuid,
  add column if not exists avatar_key text not null default 'note-01';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listening_comments_parent_id_fkey'
      and conrelid = 'public.listening_comments'::regclass) then
    alter table public.listening_comments add constraint listening_comments_parent_id_fkey
      foreign key (parent_id) references public.listening_comments(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'listening_comments_reply_to_id_fkey'
      and conrelid = 'public.listening_comments'::regclass) then
    alter table public.listening_comments add constraint listening_comments_reply_to_id_fkey
      foreign key (reply_to_id) references public.listening_comments(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'listening_comments_avatar_key_check'
      and conrelid = 'public.listening_comments'::regclass) then
    alter table public.listening_comments add constraint listening_comments_avatar_key_check
      check (avatar_key ~ '^note-(0[1-9]|10)$');
  end if;
end;
$$;

create index if not exists listening_comments_roots_created_idx
  on public.listening_comments (track_id, created_at desc, id desc) where parent_id is null;
create index if not exists listening_comments_thread_created_idx
  on public.listening_comments (parent_id, created_at asc, id asc) where parent_id is not null;

-- Auth metadata is editable only by its owner; never trust a comment's client-supplied author.
create or replace function public.qe_listener_name(metadata jsonb, listener uuid)
returns text language sql immutable set search_path = ''
as $$
  select coalesce(left(nullif(btrim(metadata ->> 'display_name'), ''), 40),
    '听者 · ' || left(listener::text, 6));
$$;

create or replace function public.qe_listener_avatar(metadata jsonb, listener uuid)
returns text language sql immutable set search_path = ''
as $$
  select case when metadata ->> 'avatar_key' ~ '^note-(0[1-9]|10)$'
    then metadata ->> 'avatar_key'
    else 'note-' || lpad(((sum(ascii(substr(listener::text, i, 1))) % 10) + 1)::text, 2, '0')
  end from generate_series(1, 8) as i;
$$;
revoke all on function public.qe_listener_name(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.qe_listener_avatar(jsonb, uuid) from public, anon, authenticated;

-- Give existing accounts a stable avatar and show their current nickname on existing comments.
update public.listening_comments as c
set author_name = public.qe_listener_name(u.raw_user_meta_data, u.id),
    avatar_key = public.qe_listener_avatar(u.raw_user_meta_data, u.id)
from auth.users as u
where c.user_id = u.id
  and (c.author_name, c.avatar_key) is distinct from
      (public.qe_listener_name(u.raw_user_meta_data, u.id), public.qe_listener_avatar(u.raw_user_meta_data, u.id));

create or replace function public.prepare_listening_comment()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  listener uuid := auth.uid();
  metadata jsonb;
begin
  if listener is null then
    raise exception '请先登录后发表评论' using errcode = '42501';
  end if;
  select u.raw_user_meta_data into metadata from auth.users u where u.id = listener;
  if not found then
    raise exception '登录账号不存在，请重新登录' using errcode = '42501';
  end if;
  new.user_id := listener;
  new.author_name := public.qe_listener_name(metadata, listener);
  new.avatar_key := public.qe_listener_avatar(metadata, listener);

  if new.parent_id is null then
    if new.reply_to_id is not null then
      raise exception '请选择要回复的评论' using errcode = '23514';
    end if;
  else
    -- Replies belong to a root on the same work, even when replying to another reply.
    perform 1 from public.listening_comments p
      where p.id = new.parent_id and p.parent_id is null and p.track_id = new.track_id
      for key share;
    if not found then
      raise exception '这条评论已不存在，或不属于这首作品' using errcode = '23514';
    end if;
    new.reply_to_id := coalesce(new.reply_to_id, new.parent_id);
    if new.reply_to_id <> new.parent_id then
      perform 1 from public.listening_comments r
        where r.id = new.reply_to_id and r.parent_id = new.parent_id and r.track_id = new.track_id
        for key share;
      if not found then
        raise exception '回复对象已不存在，或不属于这条讨论' using errcode = '23514';
      end if;
    end if;
  end if;

  new.body := btrim(new.body, E' \t\n\r');
  new.created_at := clock_timestamp();
  return new;
end;
$$;

-- Profile changes update both previous and future comments, with no public email address.
create or replace function public.sync_listening_comment_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (old.raw_user_meta_data ->> 'display_name', old.raw_user_meta_data ->> 'avatar_key')
      is distinct from (new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'avatar_key') then
    update public.listening_comments set
      author_name = public.qe_listener_name(new.raw_user_meta_data, new.id),
      avatar_key = public.qe_listener_avatar(new.raw_user_meta_data, new.id)
    where user_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_listening_comment_profile() from public, anon, authenticated;
drop trigger if exists sync_listening_comment_profile on auth.users;
create trigger sync_listening_comment_profile after update of raw_user_meta_data on auth.users
  for each row execute function public.sync_listening_comment_profile();

grant insert (parent_id, reply_to_id) on public.listening_comments to authenticated;

create or replace function public.qe_comment_reply_counts(root_ids uuid[])
returns table(root_id uuid, reply_count bigint)
language sql stable security invoker set search_path = ''
as $$
  select c.parent_id, count(*) from public.listening_comments c
  where c.parent_id = any(root_ids) group by c.parent_id;
$$;
revoke all on function public.qe_comment_reply_counts(uuid[]) from public, anon, authenticated;
grant execute on function public.qe_comment_reply_counts(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
