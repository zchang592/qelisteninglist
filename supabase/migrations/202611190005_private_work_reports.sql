begin;

create table if not exists public.listening_reports (
  id uuid primary key,
  track_id smallint not null check (track_id between 1 and 160),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 2000),
  contact_email text check (char_length(contact_email) <= 254),
  created_at timestamptz not null default now()
);

alter table public.listening_reports enable row level security;
revoke all on public.listening_reports from public, anon, authenticated;
grant select on public.listening_reports to authenticated;
drop policy if exists "Only admins can read reports" on public.listening_reports;
create policy "Only admins can read reports" on public.listening_reports
  for select to authenticated using ((select public.qe_can_read_private_progress()));

create index if not exists listening_reports_inbox_idx on public.listening_reports (created_at desc, id desc);

create or replace function public.qe_submit_report(
  request_id uuid,
  work_id integer,
  feedback text,
  reply_email text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  reporter uuid := auth.uid();
  comment_body text := regexp_replace(coalesce(feedback, ''), '^\s+|\s+$', '', 'g');
  contact text := nullif(btrim(reply_email), '');
  display_name text;
begin
  if reporter is null then
    raise exception 'Sign in to send a report' using errcode = '42501';
  end if;
  if request_id is null or work_id is null or work_id not between 1 and 160
      or char_length(comment_body) not between 1 and 2000 then
    raise exception 'Invalid report' using errcode = '22023';
  end if;
  if contact is not null and (char_length(contact) > 254 or contact !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Invalid contact email' using errcode = '22023';
  end if;

  select left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'), ''), '听者'), 40)
    into display_name from auth.users where id = reporter;
  if not found then
    raise exception 'Sign in to send a report' using errcode = '42501';
  end if;

  insert into public.listening_reports (id, track_id, user_id, author_name, body, contact_email)
    values (request_id, work_id, reporter, display_name, comment_body, contact)
    on conflict (id) do nothing;
end;
$$;
revoke all on function public.qe_submit_report(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.qe_submit_report(uuid, integer, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
