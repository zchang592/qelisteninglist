import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

let db;
const first='11111111-1111-4111-8111-111111111111';
const second='22222222-2222-4222-8222-222222222222';
const migration=await readFile(new URL('../supabase/migrations/202611160001_listening_comments.sql',import.meta.url),'utf8');
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values
      ('${first}','{"display_name":"First listener"}'),
      ('${second}','{"display_name":"Second listener"}');`);
  await db.exec(migration);
});
after(async()=>{await db?.close();});
async function role(name,id='') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec(`set role ${name}`);
}

test('migration can be reapplied and visitors can read, but cannot post',async()=>{
  await role('postgres');
  await db.exec(migration);
  await role('anon');
  assert.equal((await db.query('select count(*)::int as n from public.listening_comments')).rows[0].n,0);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(1,'anonymous')"),/permission denied/i);
});
test('database sets author identity, display name, timestamp, and trims the body',async()=>{
  await role('authenticated',first);
  const {rows:[row]}=await db.query("insert into public.listening_comments(track_id,body) values(1,'  A monophonic melody.  ') returning *");
  assert.equal(row.user_id,first);
  assert.equal(row.author_name,'First listener');
  assert.equal(row.body,'A monophonic melody.');
  assert.equal(row.track_id,1);
  assert.ok(row.id && row.created_at);
});
test('authenticated client cannot forge another author, display name, or timestamp',async()=>{
  await role('authenticated',first);
  await assert.rejects(db.query(`insert into public.listening_comments(track_id,body,user_id) values(2,'forged',$1)`,[second]),/permission denied/i);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,author_name) values(2,'forged','Someone else')"),/permission denied/i);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,created_at) values(2,'forged','2000-01-01')"),/permission denied/i);
});
test('posting is rate limited, and empty/oversized/out-of-range posts fail',async()=>{
  await role('authenticated',first);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(1,'too soon')"),/15 秒/);
  await role('postgres');
  await db.exec("update public.listening_comments set created_at=now()-interval '1 hour'");
  await role('authenticated',first);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(0,'invalid track')"),/check constraint/i);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(161,'invalid track')"),/check constraint/i);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(1,E' \n\t ')"),/check constraint/i);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(1,repeat('x',2001))"),/check constraint/i);
});
test('RLS denies deleting another listener’s comment; author can delete it',async()=>{
  await role('authenticated',second);
  assert.equal((await db.query('delete from public.listening_comments returning id')).rows.length,0);
  await assert.rejects(db.query("update public.listening_comments set body='changed'"),/permission denied/i);
  assert.equal((await db.query('select * from public.listening_comments')).rows.length,1);
  await role('anon');
  await assert.rejects(db.query('delete from public.listening_comments'),/permission denied/i);
  await role('authenticated',first);
  assert.equal((await db.query('delete from public.listening_comments returning id')).rows.length,1);
});
