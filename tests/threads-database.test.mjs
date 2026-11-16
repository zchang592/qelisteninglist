import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const oldMigration=await readFile(new URL('../supabase/migrations/202611160001_listening_comments.sql',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/202611160002_threads_and_avatars.sql',import.meta.url),'utf8');
const first='11111111-1111-4111-8111-111111111111';
const second='22222222-2222-4222-8222-222222222222';
let db, root, otherRoot, reply;
async function role(name,id='') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec(`set role ${name}`);
}
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values
      ('${first}','{"display_name":"First listener"}'),
      ('${second}','{"display_name":"Second listener","avatar_key":"note-06"}');`);
  await db.exec(oldMigration);
  await role('authenticated',first);
  root=(await db.query("insert into public.listening_comments(track_id,body) values (1,'Existing root') returning id")).rows[0].id;
  await role('postgres');
  await db.exec(migration);
});
after(async()=>{await db?.close();});

test('upgrade is repeatable, preserves existing comments, and assigns a stable avatar',async()=>{
  await role('postgres');await db.exec(migration);
  const {rows:[row]}=await db.query('select * from public.listening_comments where id=$1',[root]);
  assert.equal(row.body,'Existing root');assert.equal(row.parent_id,null);assert.match(row.avatar_key,/^note-(0[1-9]|10)$/);
  assert.equal(row.avatar_key,'note-03');
});
test('the 15-second limit is gone while comment validation remains active',async()=>{
  await role('authenticated',first);
  const a=await db.query("insert into public.listening_comments(track_id,body) values(1,'One') returning id");
  const b=await db.query("insert into public.listening_comments(track_id,body) values(2,'Two') returning id");
  assert.ok(a.rows[0].id && b.rows[0].id);otherRoot=b.rows[0].id;
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(1,' ' )"),/check constraint/i);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body) values(161,'bad')"),/check constraint/i);
});
test('replies stay under a same-track root, carry server-controlled identity, and can address a reply',async()=>{
  await role('authenticated',second);
  reply=(await db.query("insert into public.listening_comments(track_id,body,parent_id) values(1,'Reply',$1) returning *",[root])).rows[0];
  assert.equal(reply.parent_id,root);assert.equal(reply.reply_to_id,root);assert.equal(reply.user_id,second);
  assert.equal(reply.author_name,'Second listener');assert.equal(reply.avatar_key,'note-06');
  await role('authenticated',first);
  const follow=(await db.query("insert into public.listening_comments(track_id,body,parent_id,reply_to_id) values(1,'Reply to reply',$1,$2) returning *",[root,reply.id])).rows[0];
  assert.equal(follow.parent_id,root);assert.equal(follow.reply_to_id,reply.id);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,parent_id) values(2,'wrong work',$1)",[root]),/不属于这首作品/);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,parent_id) values(1,'too deep',$1)",[reply.id]),/不属于这首作品/);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,parent_id,reply_to_id) values(1,'wrong reply',$1,$2)",[root,otherRoot]),/不属于这条讨论/);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,reply_to_id) values(1,'not a reply',$1)",[root]),/请选择要回复的评论/);
});
test('public reply counts work, but anonymous users cannot write or spoof identity or avatar',async()=>{
  await role('anon');
  const count=await db.query('select * from public.qe_comment_reply_counts(array[$1::uuid])',[root]);
  assert.equal(Number(count.rows[0].reply_count),2);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,parent_id) values (1,'guest',$1)",[root]),/permission denied/i);
  await role('authenticated',first);
  await assert.rejects(db.query("insert into public.listening_comments(track_id,body,avatar_key) values(1,'forged','note-02')"),/permission denied/i);
  await assert.rejects(db.query('update public.listening_comments set avatar_key=$1',['note-02']),/permission denied/i);
});
test('profile changes update existing comments and are used by new comments',async()=>{
  await role('postgres');
  await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[JSON.stringify({display_name:'Updated listener',avatar_key:'note-09'}),first]);
  const comments=await db.query('select author_name,avatar_key from public.listening_comments where user_id=$1',[first]);
  assert.ok(comments.rows.length>0);assert.ok(comments.rows.every(r=>r.author_name==='Updated listener' && r.avatar_key==='note-09'));
  await role('authenticated',first);
  const row=(await db.query("insert into public.listening_comments(track_id,body) values(1,'New comment') returning *")).rows[0];
  assert.equal(row.author_name,'Updated listener');assert.equal(row.avatar_key,'note-09');
});
test('deleting a root retains replies and only the author may delete a comment',async()=>{
  await role('authenticated',second);
  assert.equal((await db.query('delete from public.listening_comments where id=$1 returning id',[root])).rows.length,0);
  await role('authenticated',first);
  assert.equal((await db.query('delete from public.listening_comments where id=$1 returning id',[root])).rows.length,1);
  const kept=(await db.query('select parent_id,reply_to_id,body from public.listening_comments where id=$1',[reply.id])).rows[0];
  assert.equal(kept.body,'Reply');assert.equal(kept.parent_id,null);assert.equal(kept.reply_to_id,null);
});
