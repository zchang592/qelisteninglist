import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {chromium,expect} from 'playwright/test';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const SUPABASE='skneweesbyybsuggsvyw.supabase.co';
const USER={id:'11111111-1111-4111-8111-111111111111',user_metadata:{display_name:'Test listener'}};
const session={access_token:'test-access-token',refresh_token:'test-refresh-token',expires_in:3600,user:USER};
let browser,server,origin;
before(async()=>{
  server=createServer(async(req,res)=>{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root && !path.startsWith(root+sep)){res.writeHead(403).end();return;}
    try {
      const file=path===root?resolve(root,'index.html'):path;
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'}[extname(file)]||'application/octet-stream';
      res.writeHead(200,{'Content-Type':mime});res.end(await readFile(file));
    } catch {res.writeHead(404).end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  origin=`http://127.0.0.1:${server.address().port}`;
  const executablePath=process.env.CHROME_PATH || ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(existsSync);
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox']});
  await mkdir(resolve(root,'test-results'),{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(done=>server?.close(done));});

function wav() {
  const data=Buffer.alloc(44+16000*2*4);
  data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);
  data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(16000,24);data.writeUInt32LE(32000,28);
  data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(data.length-44,40);return data;
}
const sampleTitles=['Kyrie eleison','Requiem aeternam','Dies irae','Sumer is icumen in','Messe de Nostre Dame: Kyrie'];
function recordings(term) {
  const id=/Angelis/.test(term)?1:/aeternam/.test(term)?2:/Dies/.test(term)?3:/Sumer/.test(term)?4:5;
  return {resultCount:3,results:[
    {trackName:'Mozart: Requiem - Dies irae',artistName:'Orchestra',collectionName:'Mozart Requiem',previewUrl:'https://audio-ssl.itunes.apple.com/not-allowed.mp3'},
    {trackName:sampleTitles[id-1],artistName:id===5?'Guillaume de Machaut':'Gregorian chant ensemble',collectionName:'Missa de Angelis · Medieval',previewUrl:`https://audio-ssl.mzstatic.com/test-${id}.m4a`,trackViewUrl:`https://music.apple.com/us/album/test/${id}?i=${id}`},
    {trackName:'Wrong work',artistName:'Other',previewUrl:'https://audio-ssl.mzstatic.com/wrong.mp3'}
  ]};
}
async function app(t,{admin=false,signedIn=false,comments=[],favorites=[],favoritesError=false,favoritesWriteError=false,legacyPending=null,missing=false,legacy=false,postError=false,profileError=false,mediaError=false,autoConfirm=false,refreshFails=false}={}) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  t.after(()=>context.close());
  const requests=[];const errors=[];
  const state={comments:structuredClone(comments),favorites:new Set(favorites),posts:[],progress:[],progressRows:new Map([[1,{track_id:1,status:1,note:'Listen for monophonic texture.'}]]),signups:[],media:[],deleted:[],refreshes:0,
    user:{...USER,user_metadata:{...USER.user_metadata}},userUpdates:[]};
  await context.route('**/*',async route=>{
    const request=route.request();const url=new URL(request.url());
    if(url.origin===origin){await route.continue();return;}
    if(url.hostname===SUPABASE){
      requests.push({path:url.pathname,method:request.method(),body:request.postDataJSON(),authenticated:!!request.headers().authorization});
      const json=async(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'access-control-allow-origin':'*'}});
      if(url.pathname==='/auth/v1/token') {
        if(url.searchParams.get('grant_type')==='refresh_token') {state.refreshes++;if(refreshFails)return json({msg:'Invalid refresh token'},400);}
        return json({...session,user:state.user});
      }
      if(url.pathname==='/auth/v1/user'){
        if(request.method()==='PUT'){
          if(profileError)return json({message:'资料暂时无法保存'},400);
          const payload=request.postDataJSON();state.userUpdates.push(payload);
          state.user={...state.user,user_metadata:{...state.user.user_metadata,...payload.data}};
          state.comments=state.comments.map(row=>row.user_id===USER.id?{...row,author_name:state.user.user_metadata.display_name,avatar_key:state.user.user_metadata.avatar_key}:row);
        }
        return json(state.user);
      }
      if(url.pathname==='/auth/v1/signup'){
        const payload=request.postDataJSON();state.signups.push(payload);
        if(autoConfirm){state.user={...state.user,user_metadata:{...state.user.user_metadata,...payload.data}};return json({...session,user:state.user});}
        return json({user:USER});
      }
      if(url.pathname==='/auth/v1/logout')return json({});
      if(url.pathname.endsWith('/rpc/am_i_qe_admin'))return json(admin);
      if(url.pathname.endsWith('/rpc/claim_qe_admin'))return json({});
      if(url.pathname.endsWith('/rpc/qe_comment_reply_counts')){
        const roots=request.postDataJSON().root_ids;
        return json(roots.map(root_id=>({root_id,reply_count:state.comments.filter(row=>row.parent_id===root_id).length})));
      }
      if(url.pathname.endsWith('/listening_progress')){
        if(!admin)return json({message:'forbidden'},403);
        if(request.method()==='PATCH'){
          const trackId=Number(url.searchParams.get('track_id')?.slice(3));const payload=request.postDataJSON();
          state.progress.push({method:'PATCH',trackId,payload});
          if(!state.progressRows.has(trackId))return json([]);
          const row={...state.progressRows.get(trackId),...payload};state.progressRows.set(trackId,row);return json([row]);
        }
        if(request.method()==='POST'){
          const payload=request.postDataJSON();state.progress.push({method:'POST',trackId:payload.track_id,payload});
          if(!state.progressRows.has(payload.track_id))state.progressRows.set(payload.track_id,payload);
          return route.fulfill({status:201,body:''});
        }
        return json([...state.progressRows.values()]);
      }
      if(url.pathname.endsWith('/listening_favorites')){
        if(favoritesError)return json({message:'favorites unavailable'},503);
        if(favoritesWriteError && request.method()!=='GET')return json({message:'favorites update failed'},503);
        if(request.method()==='POST'){state.favorites.add(request.postDataJSON().track_id);return route.fulfill({status:201,body:''});}
        if(request.method()==='DELETE'){state.favorites.delete(Number(url.searchParams.get('track_id')?.slice(3)));return route.fulfill({status:204,body:''});}
        return json([...state.favorites].map(track_id=>({track_id})));
      }
      if(url.pathname.endsWith('/listening_comments')){
        if(missing)return json({code:'PGRST205',message:'Table not found'},404);
        if(legacy && request.method()==='GET' && url.searchParams.get('select')?.includes('parent_id'))return json({code:'42703',message:'column parent_id does not exist'},400);
        if(request.method()==='POST'){
          if(postError)return json({message:'暂时无法发布'},400);
          const payload=request.postDataJSON();state.posts.push(payload);
          const row={id:`aaaaaaaa-aaaa-4aaa-8aaa-${String(state.posts.length).padStart(12,'0')}`,track_id:payload.track_id,body:payload.body,
            parent_id:payload.parent_id || null,reply_to_id:payload.reply_to_id || null,user_id:USER.id,author_name:state.user.user_metadata.display_name,
            avatar_key:state.user.user_metadata.avatar_key || 'note-03',created_at:new Date().toISOString()};
          state.comments.unshift(row);return json([row],201);
        }
        if(request.method()==='DELETE'){
          const id=url.searchParams.get('id')?.slice(3);state.deleted.push(id);
          const removed=state.comments.filter(row=>row.id===id);state.comments=state.comments.filter(row=>row.id!==id).map(row=>({...row,parent_id:row.parent_id===id?null:row.parent_id,reply_to_id:row.reply_to_id===id?null:row.reply_to_id}));return json(removed);
        }
        const id=url.searchParams.get('track_id')?.slice(3);
        let result=state.comments.filter(row=>!id || row.track_id===Number(id));
        const parent=url.searchParams.get('parent_id');
        if(parent==='is.null')result=result.filter(row=>!row.parent_id);
        else if(parent?.startsWith('eq.'))result=result.filter(row=>row.parent_id===parent.slice(3));
        const ascending=url.searchParams.get('order')?.startsWith('created_at.asc');
        result.sort((a,b)=>(ascending?1:-1)*(a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
        if(url.searchParams.get('or'))result=result.slice(20);
        return json(result.slice(0,21));
      }
      return json({message:'Unexpected test request'},400);
    }
    if(url.hostname==='itunes.apple.com'){
      state.media.push(url.searchParams.get('term'));
      if(mediaError)return route.abort();
      const payload=recordings(url.searchParams.get('term')||'');
      const callback=url.searchParams.get('callback');
      return route.fulfill({status:200,contentType:callback?'text/javascript':'application/json',body:callback?`${callback}(${JSON.stringify(payload)})`:JSON.stringify(payload),headers:{'access-control-allow-origin':'*'}});
    }
    if(url.hostname.endsWith('.mzstatic.com'))return route.fulfill({status:200,contentType:'audio/wav',body:wav(),headers:{'access-control-allow-origin':'*'}});
    await route.abort();
  });
  if(signedIn) await context.addInitScript(({session,user})=>localStorage.setItem('dmus-qe-admin-session-v1',JSON.stringify({...session,expires_at:Math.floor(Date.now()/1000)+3600})),{session,user:USER});
  if(legacyPending)await context.addInitScript(pending=>localStorage.setItem('dmus-qe-listening-cloud-pending-v1',JSON.stringify(pending)),legacyPending);
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin);await expect(page.locator('.track:visible')).toHaveCount(5);
  if(signedIn)await expect(page.locator('#modeLabel')).toHaveText(admin?'管理员':'已登录');
  if(admin && !legacyPending)await expect(page.locator('#confirmedCount')).toHaveText('1');
  t.after(()=>assert.deepEqual(errors,[],'uncaught browser errors'));
  return {page,state,requests,context};
}

test('all 160 works are retained; global search and period navigation work',async t=>{
  const {page}=await app(t);
  assert.equal(await page.locator('.track').count(),160);
  await page.getByRole('button',{name:'Baroque 巴洛克，29 首作品',exact:true}).click();
  await expect(page.locator('.track:visible')).toHaveCount(29);
  await expect(page.locator('#pilotNote')).toBeHidden();
  await page.locator('#trackSearch').fill('Josquin');
  await expect(page.locator('.track:visible')).toHaveCount(1);
  await expect(page.locator('#track-6')).toBeVisible();
  await page.locator('#trackSearch').fill('160');await expect(page.locator('#track-160')).toBeVisible();
  await page.locator('#trackSearch').fill('does not exist');await expect(page.locator('#emptySearch')).toBeVisible();
  await page.locator('#clearSearch').click();await expect(page.locator('.track:visible')).toHaveCount(29);
  await page.locator('#trackSearch').fill('Bach');
  await page.getByRole('button',{name:'Renaissance 文艺复兴，6 首作品',exact:true}).click();
  await page.locator('#trackSearch').fill('Machaut');await page.locator('#trackSearch').fill('');
  await expect(page.locator('.track:visible')).toHaveCount(6);
  await page.getByRole('button',{name:'全部作品',exact:true}).click();await expect(page.locator('.track:visible')).toHaveCount(160);
});
test('public visitors never load or see private progress and notes',async t=>{
  const {page,requests}=await app(t);
  await expect(page.locator('#adminProgressDialog')).toBeHidden();
  await expect(page.locator('#profileAdminProgress')).toBeHidden();
  await expect(page.locator('.state-btn, .note-toggle, .note-panel')).toHaveCount(0);
  assert.equal(requests.filter(r=>r.path.endsWith('/listening_progress')).length,0);
  await page.locator('#favoritesNav').click();
  await expect(page.getByText('登录后收藏作品')).toBeVisible();
});
test('personal favorites persist and can be viewed by period, composer, or as a flat list',async t=>{
  const {page,state}=await app(t,{signedIn:true,favorites:[1,5,13]});
  await expect(page.locator('#favoritesCount')).toHaveText('3');
  await page.locator('#favoritesNav').click();
  await expect(page.locator('#favoritesApp .track:visible')).toHaveCount(3);
  await expect(page.locator('#favoritesApp .favorite-period')).toHaveCount(2);
  await page.getByRole('button',{name:'按作曲家'}).click();
  await expect(page.locator('#favoritesApp .composer')).toHaveCount(3);
  const names=await page.locator('#favoritesApp .composer > summary h3').allTextContents();
  assert.ok(names[0].startsWith('Antonio Vivaldi'));
  await page.getByRole('button',{name:'展开全部',exact:true}).click();
  await expect(page.locator('#favoritesApp .favorite-flat .track')).toHaveCount(3);
  await expect(page.locator('#favorite-track-13 .favorite-track-meta')).toContainText('Vivaldi');
  await page.locator('#favorite-track-1 .favorite-button').click();
  await expect.poll(()=>state.favorites.has(1)).toBe(false);
  await expect(page.locator('#favoritesApp .favorite-flat .track')).toHaveCount(2);
  await page.reload();await expect(page.locator('#favoritesCount')).toHaveText('2');
  await page.locator('#favoritesNav').click();await expect(page.locator('#favoritesApp .track:visible')).toHaveCount(2);
});
test('clicking a heart as a guest resumes the intended favorite after sign in',async t=>{
  const {page,state}=await app(t);
  await page.getByRole('button',{name:'收藏第 1 首',exact:true}).click();
  await expect(page.locator('#authPanel')).toBeVisible();
  await page.locator('#loginEmail').fill('listener@example.com');await page.locator('#loginPassword').fill('test-password-123');await page.locator('#loginSubmit').click();
  await expect.poll(()=>state.favorites.has(1)).toBe(true);
  await expect(page.getByRole('button',{name:'取消收藏第 1 首',exact:true})).toBeVisible();
  await page.locator('#avatarTrigger').hover();await page.locator('#profileLogout').click();
  await page.locator('#favoritesNav').click();await expect(page.getByText('登录后收藏作品')).toBeVisible();
});
test('favorites failure is reported without showing a false saved state',async t=>{
  const {page}=await app(t,{signedIn:true,favoritesError:true});
  await page.locator('#favoritesNav').click();await expect(page.getByText('暂时无法读取收藏')).toBeVisible();
  await expect(page.getByRole('button',{name:'重新加载',exact:true})).toBeVisible();
});
test('a failed favorite write does not falsely mark the track as saved',async t=>{
  const {page,state}=await app(t,{signedIn:true,favoritesWriteError:true});
  await expect(page.locator('#favoritesCount')).toHaveText('0');
  await page.getByRole('button',{name:'收藏第 1 首',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('收藏保存失败');
  await expect(page.getByRole('button',{name:'收藏第 1 首',exact:true})).toHaveAttribute('aria-pressed','false');
  assert.equal(state.favorites.size,0);
});
test('five Medieval works retain their previews and provide four honest YouTube slots and NetEase search',async t=>{
  const {page,state}=await app(t);
  for(let id=1;id<=5;id++) {
    const row=page.locator(`#track-${id}`);
    if(id!==1)await row.locator('.recording-versions > summary').click();
    const youtube=row.locator('.youtube');const netease=row.locator('.neteasecloudmusic');
    assert.match(await youtube.getAttribute('href'),/^https:\/\/www.youtube.com\/results\?search_query=/);
    assert.match(await netease.getAttribute('href'),/^https:\/\/music.163.com\/#\/search\/m\//);
    assert.equal(await youtube.getAttribute('target'),'_blank');
    await expect(row.locator('.recording-slot')).toHaveCount(4);
    await expect(row.locator('.recording-slot-pending')).toHaveCount(4);
    await expect(row.locator('.recording-slot a')).toHaveCount(0);
    await row.locator('.preview-button').click();await expect(row.locator('audio')).toBeVisible();
    assert.equal(await row.locator('select option').count(),1);
    assert.equal(await row.locator('audio').evaluate(audio=>audio.paused),true);
    assert.match(await row.locator('audio').getAttribute('src'),new RegExp(`test-${id}`));
  }
  await expect(page.locator('a[href*="spotify"]')).toHaveCount(0);
  assert.equal(state.media.length,5);
  await page.locator('#track-1 audio').evaluate(audio=>audio.play());
  await page.locator('#track-2 audio').evaluate(audio=>audio.play());
  assert.equal(await page.locator('#track-1 audio').evaluate(audio=>audio.paused),true);
  assert.equal(await page.locator('#track-2 audio').evaluate(audio=>audio.paused),false);
  assert.equal(await page.locator('#track-2 audio').evaluate(audio=>audio.duration),4);
});
test('media network failures keep search destinations usable and allow a retry',async t=>{
  const {page}=await app(t,{mediaError:true});
  await page.locator('#track-1 .preview-button').click();
  await expect(page.locator('#track-1 .media-feedback')).toContainText('无法连接');
  await expect(page.locator('#track-1 .preview-button')).toHaveText('重试试听');
  await expect(page.locator('#track-1 .youtube')).toBeVisible();
});
test('comments are rendered only in a separate modal; guests cannot post and text is escaped',async t=>{
  const {page,requests}=await app(t,{comments:[{id:'one',track_id:1,user_id:'someone-else',author_name:'A listener',body:'<img src=x onerror=alert(1)>',created_at:'2026-11-16T00:00:00Z'}]});
  assert.equal(requests.filter(r=>r.path.endsWith('listening_comments')).length,0);
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await expect(page.locator('#commentsDialog')).toBeVisible();await expect(page.locator('.comment-body')).toHaveText('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#commentsList img').count(),0);
  await expect(page.locator('#commentForm')).toBeHidden();await expect(page.locator('#commentLogin')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('#commentsDialog')).toBeHidden();
  await expect(page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true})).toBeFocused();
});
test('public signup submits nickname and production/local redirect, and asks for email confirmation',async t=>{
  const {page,state}=await app(t);
  await page.locator('#adminToggle').click();await page.locator('#signupTab').click();
  await page.locator('#signupName').fill('New listener');await page.locator('#signupEmail').fill('listener@example.com');await page.locator('#signupPassword').fill('test-password-123');await page.locator('#signupSubmit').click();
  await expect(page.locator('#authMessage')).toContainText('确认邮件');
  assert.equal(state.signups[0].data.display_name,'New listener');
  assert.match(state.signups[0].data.avatar_key,/^note-(0[1-9]|10)$/);
  assert.equal(state.signups[0].email,'listener@example.com');
  await expect(page.locator('#modeLabel')).toHaveText('访客');await expect(page.locator('#activationBlock')).toBeHidden();
  assert.equal(await page.locator('#signupPassword').inputValue(),'');
});
test('ordinary signup with immediate session enables discussion without administrator activation',async t=>{
  const {page}=await app(t,{autoConfirm:true});
  await page.locator('#adminToggle').click();await page.locator('#signupTab').click();
  await page.locator('#signupName').fill('New listener');await page.locator('#signupEmail').fill('listener@example.com');await page.locator('#signupPassword').fill('test-password-123');await page.locator('#signupSubmit').click();
  await expect(page.locator('#modeLabel')).toHaveText('已登录');await expect(page.locator('#authMessage')).toContainText('参与曲目讨论');
  await expect(page.locator('#topAvatar svg')).toHaveAttribute('data-avatar',/^note-(0[1-9]|10)$/);
  await expect(page.locator('#profileAdminProgress')).toBeHidden();await expect(page.locator('#track-1 .state-btn')).toHaveCount(0);
});
test('hover account menu changes the avatar and nickname, persisting across a reload and existing comments',async t=>{
  const old={id:'11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa',track_id:1,user_id:USER.id,author_name:'Test listener',avatar_key:'note-03',body:'Existing comment',created_at:'2026-11-16T00:00:00Z'};
  const {page,state}=await app(t,{signedIn:true,comments:[old]});
  await expect(page.locator('#topAvatar svg')).toHaveAttribute('data-avatar','note-03');
  await page.locator('#avatarTrigger').hover();
  await expect(page.locator('#avatarPopover')).toBeVisible();
  await expect(page.locator('.avatar-option')).toHaveCount(10);
  await page.getByRole('button',{name:'选择薄荷音符头像'}).click();
  await expect(page.locator('#topAvatar svg')).toHaveAttribute('data-avatar','note-02');
  await expect(page.locator('#profileMessage')).toHaveText('头像已更新');
  await page.locator('#profileName').fill('New name');await page.locator('#profileSave').click();
  await expect(page.locator('#profileMessage')).toHaveText('昵称已更新');
  assert.equal(state.userUpdates.length,2);
  assert.equal(state.user.user_metadata.avatar_key,'note-02');assert.equal(state.user.user_metadata.display_name,'New name');
  await page.reload();await expect(page.locator('#topAvatar svg')).toHaveAttribute('data-avatar','note-02');
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await expect(page.locator('.comment-author')).toHaveText('New name');
  await expect(page.locator('.comment-avatar')).toHaveAttribute('data-avatar','note-02');
});
test('failed avatar updates retain the previous selection and show an actionable error',async t=>{
  const {page,state}=await app(t,{signedIn:true,profileError:true});
  await page.locator('#avatarTrigger').hover();await page.getByRole('button',{name:'选择薄荷音符头像'}).click();
  await expect(page.locator('#profileMessage')).toContainText('资料暂时无法保存');
  await expect(page.locator('#topAvatar svg')).toHaveAttribute('data-avatar','note-03');
  assert.equal(state.userUpdates.length,0);
});
test('account menu works on a narrow screen with touch-sized controls and keyboard dismissal',async t=>{
  const {page}=await app(t,{signedIn:true});
  await page.setViewportSize({width:320,height:700});
  await page.locator('#avatarTrigger').click();
  await expect(page.locator('#avatarPopover')).toBeVisible();
  const rect=await page.locator('#avatarPopover').boundingBox();assert.ok(rect.x>=0 && rect.x+rect.width<=320);
  await page.getByRole('button',{name:'选择薄荷音符头像'}).focus();
  await page.keyboard.press('Escape');await expect(page.locator('#avatarPopover')).toBeHidden();
  await expect(page.locator('#avatarTrigger')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#avatarPopover')).toBeVisible();
});
test('threaded discussions keep replies under their root and can reply to an individual reply',async t=>{
  const root='aaaaaaaa-aaaa-4aaa-8aaa-000000000001';
  const child='aaaaaaaa-aaaa-4aaa-8aaa-000000000002';
  const comments=[
    {id:root,track_id:1,user_id:'22222222-2222-4222-8222-222222222222',author_name:'First listener',avatar_key:'note-06',body:'Root comment',created_at:'2026-11-15T00:00:00Z',parent_id:null},
    {id:child,track_id:1,user_id:'33333333-3333-4333-8333-333333333333',author_name:'Second listener',avatar_key:'note-09',body:'A nested reply',created_at:'2026-11-15T00:01:00Z',parent_id:root,reply_to_id:root},
  ];
  const {page,state}=await app(t,{signedIn:true,comments});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await expect(page.locator('#commentsList > .comment-item')).toHaveCount(1);
  await expect(page.getByText('A nested reply')).toBeHidden();
  await page.getByRole('button',{name:/查看 1 条回复/}).click();
  await expect(page.getByText('A nested reply')).toBeVisible();
  await page.getByRole('button',{name:'回复 Second listener 的评论'}).click();
  await expect(page.getByRole('textbox',{name:'回复 Second listener'})).toBeFocused();
  await page.getByRole('textbox',{name:'回复 Second listener'}).fill('I hear that too.');
  await page.getByRole('button',{name:'发布回复'}).click();
  await expect(page.getByText('I hear that too.')).toBeVisible();
  await expect(page.locator('.reply-mention')).toContainText('Second listener');
  assert.deepEqual(state.posts,[{track_id:1,body:'I hear that too.',parent_id:root,reply_to_id:child}]);
  await page.locator('#commentBody').fill('Another thought');await page.locator('#postComment').click();
  await expect.poll(()=>state.posts.length).toBe(2);
});
test('guests can read replies and are invited to sign in before replying',async t=>{
  const root='aaaaaaaa-aaaa-4aaa-8aaa-000000000001';
  const child='aaaaaaaa-aaaa-4aaa-8aaa-000000000002';
  const comments=[
    {id:root,track_id:1,user_id:'other',author_name:'A listener',body:'Root',created_at:'2026-11-15T00:00:00Z',parent_id:null},
    {id:child,track_id:1,user_id:'other',author_name:'A listener',body:'Reply',created_at:'2026-11-15T00:01:00Z',parent_id:root,reply_to_id:root},
  ];
  const {page}=await app(t,{comments});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await page.getByRole('button',{name:/查看 1 条回复/}).click();await expect(page.getByText('Reply',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'回复 A listener 的评论'}).first().click();await expect(page.locator('#authPanel')).toBeVisible();
  await page.locator('#loginEmail').fill('listener@example.com');await page.locator('#loginPassword').fill('test-password-123');await page.locator('#loginSubmit').click();
  await expect(page.locator('.reply-form textarea')).toBeVisible();
});
test('reply pagination loads all replies and keeps existing root pagination separate',async t=>{
  const root='aaaaaaaa-aaaa-4aaa-8aaa-000000000001';
  const comments=[{id:root,track_id:1,user_id:'other',author_name:'A listener',body:'Root',created_at:'2026-11-01T00:00:00Z',parent_id:null},
    ...Array.from({length:25},(_,i)=>({id:`reply-${String(i).padStart(2,'0')}`,track_id:1,user_id:'other',author_name:'A listener',body:`Reply ${i}`,created_at:new Date(Date.UTC(2026,10,2,0,i)).toISOString(),parent_id:root,reply_to_id:root}))];
  const {page}=await app(t,{signedIn:true,comments});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await page.getByRole('button',{name:/查看 25 条回复/}).click();
  await expect(page.locator('.comment-reply')).toHaveCount(20);
  await page.getByRole('button',{name:'加载更多回复'}).click();await expect(page.locator('.comment-reply')).toHaveCount(25);
  await expect(page.getByRole('button',{name:'加载更多回复'})).toBeHidden();
});
test('deleting an owned root keeps another listener’s reply visible as a separate comment',async t=>{
  const root='aaaaaaaa-aaaa-4aaa-8aaa-000000000001';
  const child='aaaaaaaa-aaaa-4aaa-8aaa-000000000002';
  const comments=[
    {id:root,track_id:1,user_id:USER.id,author_name:'Test listener',body:'My root',created_at:'2026-11-15T00:00:00Z',parent_id:null},
    {id:child,track_id:1,user_id:'other',author_name:'Other listener',body:'Their reply',created_at:'2026-11-15T00:01:00Z',parent_id:root,reply_to_id:root},
  ];
  const {page}=await app(t,{signedIn:true,comments});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'删除我的评论'}).click();
  await expect(page.getByText('My root')).toBeHidden();await expect(page.getByText('Their reply')).toBeVisible();
  await expect(page.locator('#commentsList > .comment-item')).toHaveCount(1);
});
test('the previous schema continues to read and post root comments until upgraded',async t=>{
  const {page,state}=await app(t,{signedIn:true,legacy:true,comments:[{id:'old',track_id:1,user_id:'other',author_name:'Earlier listener',body:'Earlier comment',created_at:'2026-11-15T00:00:00Z'}]});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await expect(page.getByText('Earlier comment')).toBeVisible();await expect(page.locator('#threadStatus')).toBeVisible();
  await expect(page.locator('.reply-action')).toHaveCount(0);
  await page.locator('#commentBody').fill('Still works');await page.locator('#postComment').click();
  await expect.poll(()=>state.posts.length).toBe(1);
});
test('signing in from the discussion resumes the same thread; a member can publish and delete',async t=>{
  const {page,state}=await app(t);
  await page.getByRole('button',{name:'打开第 2 首的评论窗口',exact:true}).click();
  await page.locator('#commentLogin').click();
  await page.locator('#loginEmail').fill('listener@example.com');await page.locator('#loginPassword').fill('test-password-123');await page.locator('#loginSubmit').click();
  await expect(page.locator('#authPanel')).toBeHidden();await expect(page.locator('#commentForm')).toBeVisible();
  await page.locator('#commentBody').fill('  Listen to the chant’s phrasing.  ');await page.locator('#postComment').click();
  await expect(page.locator('.comment-body')).toHaveText('Listen to the chant’s phrasing.');
  assert.deepEqual(state.posts,[{track_id:2,body:'Listen to the chant’s phrasing.'}]);
  await expect(page.locator('#track-1 .state-btn')).toHaveCount(0);
  page.once('dialog',dialog=>dialog.accept());await page.locator('.delete-comment').click();await expect(page.locator('.comment-item')).toHaveCount(0);
  assert.equal(state.deleted.length,1);
});
test('failed comment submissions keep the draft, and a missing table shows no false success',async t=>{
  const {page,state}=await app(t,{signedIn:true,postError:true});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();await expect(page.locator('#postComment')).toBeEnabled();
  await page.locator('#commentBody').fill('Keep my note.');await page.locator('#postComment').click();
  await expect(page.locator('#commentFeedback')).toContainText('暂时无法发布');assert.equal(await page.locator('#commentBody').inputValue(),'Keep my note.');assert.equal(state.posts.length,0);
  await page.locator('#closeComments').click();
  const other=await app(t,{signedIn:true,missing:true});
  await other.page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
  await expect(other.page.locator('#commentsStatus')).toHaveText('评论服务尚未启用，请稍后再来。');await expect(other.page.locator('#postComment')).toBeDisabled();
});
test('community view supports pagination and selecting a work, and cannot delete others’ comments',async t=>{
  const comments=Array.from({length:25},(_,i)=>({id:`comment-${i}`,track_id:1,user_id:'other-user',author_name:'Another listener',body:`Note ${i}`,created_at:new Date(Date.now()-i*60000).toISOString()}));
  const {page}=await app(t,{signedIn:true,comments});
  await page.locator('#communityBtn').click();await expect(page.locator('.comment-item')).toHaveCount(20);await expect(page.locator('.delete-comment')).toHaveCount(0);
  await page.locator('#moreComments').click();await expect(page.locator('.comment-item')).toHaveCount(25);await expect(page.locator('#moreComments')).toBeHidden();
  await page.locator('#commentTrack').selectOption('1');await expect(page.locator('#commentForm')).toBeVisible();await expect(page.locator('#commentsDescription')).toContainText('Gregorian chant');
});
test('administrator opens private progress from the avatar, preserves old data, and updates statuses without editing notes',async t=>{
  const {page,state,requests}=await app(t,{signedIn:true,admin:true});
  await expect(page.locator('#adminProgressDialog')).toBeHidden();
  await expect(page.locator('#track-1 .state-btn')).toHaveCount(0);
  await expect(page.locator('.note-toggle, .note-panel')).toHaveCount(0);
  await page.locator('#avatarTrigger').hover();await page.locator('#profileAdminProgress').click();
  await expect(page.locator('#adminProgressDialog')).toBeVisible();
  await expect(page.locator('#confirmedCount')).toHaveText('1');
  await page.locator('.admin-period > summary').first().click();await page.locator('.admin-composer > summary').first().click();
  await page.getByRole('checkbox',{name:/第 1 首/}).click();
  await expect.poll(()=>state.progress.length).toBeGreaterThan(0);
  assert.equal(state.progress[0].payload.status,2);
  assert.equal('note' in state.progress[0].payload,false);
  assert.equal(state.progressRows.get(1).note,'Listen for monophonic texture.');
  assert.ok(requests.filter(r=>r.path.endsWith('/listening_progress')).every(r=>r.authenticated));
  await page.getByRole('checkbox',{name:/第 2 首/}).click();
  await expect.poll(()=>state.progressRows.get(2)?.status).toBe(1);
  assert.equal(state.progressRows.get(2).note,'');
  const download=page.waitForEvent('download');await page.locator('#exportBtn').click();assert.match((await download).suggestedFilename(),/DMus_QE/);
});
test('previously queued note edits survive the transition without exposing the old notes UI',async t=>{
  const {page,state}=await app(t,{signedIn:true,admin:true,legacyPending:{'1':{status:2,note:'A pending legacy edit',revision:1}}});
  await expect.poll(()=>state.progressRows.get(1)?.note).toBe('A pending legacy edit');
  assert.equal(state.progressRows.get(1).status,2);
  await expect(page.locator('.note-toggle, .note-panel')).toHaveCount(0);
});
test('expired member sessions refresh before restoring the account',async t=>{
  const {page,state}=await app(t);
  await page.evaluate(session=>localStorage.setItem('dmus-qe-admin-session-v1',JSON.stringify({...session,expires_at:1})),session);
  await page.reload();await expect(page.locator('#modeLabel')).toHaveText('已登录');assert.equal(state.refreshes,1);
});
test('layout fits desktop, tablet, and 320/390 px phones; dialogs stay within the viewport',async t=>{
  const {page}=await app(t);
  for(const width of [1440,1024,820,768,390,320]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no horizontal overflow at ${width}`);
    await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();
    const rect=await page.locator('#commentsDialog').boundingBox();assert.ok(rect.x>=0 && rect.x+rect.width<=width+1);
    await page.locator('#closeComments').click();
    if(width===1440 || width===390){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(root,`test-results/library-${width}.png`),fullPage:true});}
  }
  await page.locator('#adminToggle').click();await page.locator('#signupTab').click();
  assert.ok(await page.locator('#signupSubmit').isVisible());
});
