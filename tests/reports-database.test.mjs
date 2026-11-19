import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('work reports are private, validated, and stored once on retry', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    create function public.qe_can_read_private_progress() returns boolean language sql stable
      as $$ select auth.uid()='11111111-1111-4111-8111-111111111111'::uuid $$;
    insert into auth.users values ('22222222-2222-4222-8222-222222222222', '{"display_name":"Listener"}');`);
  const migration = await readFile(new URL('../supabase/migrations/202611190005_private_work_reports.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  const requestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const send = (track, body, contact) => db.query('select public.qe_submit_report($1,$2,$3,$4)', [requestId,track,body,contact]);
  const assume = async (role, id='') => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec(`set role ${role}`);
  };

  await assume('anon');
  await assert.rejects(send(67, 'Wrong performance', null), /permission denied/i);
  await assert.rejects(db.query('select * from public.listening_reports'), /permission denied/i);
  await assume('authenticated', '22222222-2222-4222-8222-222222222222');
  await assert.rejects(send(161, 'Wrong work', null), /invalid report/i);
  await assert.rejects(send(67, '\n \t', null), /invalid report/i);
  await assert.rejects(send(67, 'Wrong file', 'invalid'), /invalid contact email/i);
  await send(67, '  Wrong performance.  ', ' me@example.com ');
  await send(67, 'Duplicate', null);
  assert.equal((await db.query('select * from public.listening_reports')).rows.length, 0);
  await assert.rejects(db.query('delete from public.listening_reports'), /permission denied/i);
  await assume('authenticated', '11111111-1111-4111-8111-111111111111');
  const {rows} = await db.query('select track_id,author_name,body,contact_email from public.listening_reports');
  assert.deepEqual(rows,[{track_id:67,author_name:'Listener',body:'Wrong performance.',contact_email:'me@example.com'}]);
});
