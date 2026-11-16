import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const migration=await readFile(new URL('../supabase/migrations/202611160003_private_progress_and_favorites.sql',import.meta.url),'utf8');
const admin='11111111-1111-4111-8111-111111111111';
const first='22222222-2222-4222-8222-222222222222';
const second='33333333-3333-4333-8333-333333333333';
let db;
async function role(name,id='') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec(`set role ${name}`);
}
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function public.am_i_qe_admin() returns boolean language sql stable as
      $$ select auth.uid() = '${admin}'::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    grant execute on function public.am_i_qe_admin() to authenticated;
    insert into auth.users values ('${admin}'),('${first}'),('${second}');
    create table public.listening_progress(track_id integer primary key, status integer, note text, updated_at timestamptz default now());
    insert into public.listening_progress(track_id,status,note) values (1,1,'A preexisting note'),(2,2,'Another note');
    alter table public.listening_progress enable row level security;
    grant select on public.listening_progress to anon, authenticated;
    grant update on public.listening_progress to authenticated;
    create policy original_public_read on public.listening_progress for select to anon,authenticated using (true);
    create policy original_admin_update on public.listening_progress for update to authenticated
      using ((select public.am_i_qe_admin())) with check ((select public.am_i_qe_admin()));`);
  await db.exec(migration);
});
after(async()=>{await db?.close();});

test('upgrade is repeatable and preserves the existing progress and note data',async()=>{
  await role('postgres');await db.exec(migration);
  const {rows}=await db.query('select track_id,status,note from public.listening_progress order by track_id');
  assert.deepEqual(rows,[{track_id:1,status:1,note:'A preexisting note'},{track_id:2,status:2,note:'Another note'}]);
});
test('restrictive privacy policy blocks anonymous and non-admin readers despite the old public-read policy',async()=>{
  await role('anon');assert.equal((await db.query('select * from public.listening_progress')).rows.length,0);
  await role('authenticated',first);assert.equal((await db.query('select * from public.listening_progress')).rows.length,0);
  await role('authenticated',admin);assert.equal((await db.query('select * from public.listening_progress')).rows.length,2);
});
test('administrator can still update progress while a normal account cannot',async()=>{
  await role('authenticated',first);
  assert.equal((await db.query('update public.listening_progress set status=0 where track_id=1 returning *')).rows.length,0);
  await role('authenticated',admin);
  const updated=await db.query('update public.listening_progress set status=2 where track_id=1 returning note');
  assert.equal(updated.rows[0].note,'A preexisting note');
});
test('favorites are private to the authenticated account; guests cannot access them',async()=>{
  await role('anon');await assert.rejects(db.query('select * from public.listening_favorites'),/permission denied/i);
  await role('authenticated',first);
  const created=await db.query('insert into public.listening_favorites(track_id) values(1) returning *');
  assert.equal(created.rows[0].user_id,first);
  await role('authenticated',second);
  assert.equal((await db.query('select * from public.listening_favorites')).rows.length,0);
  assert.equal((await db.query('delete from public.listening_favorites where user_id=$1 returning *',[first])).rows.length,0);
  await db.query('insert into public.listening_favorites(track_id) values(1)');
  assert.equal((await db.query('select * from public.listening_favorites')).rows.length,1);
  await role('authenticated',first);
  assert.equal((await db.query('select * from public.listening_favorites')).rows.length,1);
  assert.equal((await db.query('delete from public.listening_favorites where track_id=1 returning *')).rows.length,1);
});
test('favorite user and timestamp cannot be forged; duplicates and invalid track IDs are rejected',async()=>{
  await role('authenticated',first);
  await assert.rejects(db.query('insert into public.listening_favorites(track_id,user_id) values(1,$1)',[second]),/permission denied/i);
  await assert.rejects(db.query("insert into public.listening_favorites(track_id,created_at) values(1,'2000-01-01')"),/permission denied/i);
  await assert.rejects(db.query('insert into public.listening_favorites(track_id) values(0)'),/check constraint/i);
  await assert.rejects(db.query('insert into public.listening_favorites(track_id) values(161)'),/check constraint/i);
  await db.query('insert into public.listening_favorites(track_id) values(2)');
  await assert.rejects(db.query('insert into public.listening_favorites(track_id) values(2)'),/unique constraint/i);
});
