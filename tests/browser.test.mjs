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
async function app(t,{admin=false,signedIn=false,comments=[],missing=false,postError=false,mediaError=false,autoConfirm=false,refreshFails=false}={}) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  t.after(()=>context.close());
  const requests=[];const errors=[];
  const state={comments:[...comments],posts:[],progress:[],signups:[],media:[],deleted:[],refreshes:0};
  await context.route('**/*',async route=>{
    const request=route.request();const url=new URL(request.url());
    if(url.origin===origin){await route.continue();return;}
    if(url.hostname===SUPABASE){
      requests.push({path:url.pathname,method:request.method(),body:request.postDataJSON()});
      const json=async(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'access-control-allow-origin':'*'}});
      if(url.pathname==='/auth/v1/token') {
        if(url.searchParams.get('grant_type')==='refresh_token') {state.refreshes++;if(refreshFails)return json({msg:'Invalid refresh token'},400);}
        return json(session);
      }
      if(url.pathname==='/auth/v1/user')return json(USER);
      if(url.pathname==='/auth/v1/signup'){state.signups.push(request.postDataJSON());return json(autoConfirm?session:{user:USER});}
      if(url.pathname==='/auth/v1/logout')return json({});
      if(url.pathname.endsWith('/rpc/am_i_qe_admin'))return json(admin);
      if(url.pathname.endsWith('/rpc/claim_qe_admin'))return json({});
      if(url.pathname.endsWith('/listening_progress')){
        if(request.method()==='POST'){state.progress.push(request.postDataJSON());return route.fulfill({status:201,body:''});}
        return json([{track_id:1,status:1,note:'Listen for monophonic texture.'}]);
      }
      if(url.pathname.endsWith('/listening_comments')){
        if(missing)return json({code:'PGRST205',message:'Table not found'},404);
        if(request.method()==='POST'){
          if(postError)return json({message:'请稍等 15 秒再发布下一条评论'},400);
          const payload=request.postDataJSON();state.posts.push(payload);
          const row={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',track_id:payload.track_id,body:payload.body,user_id:USER.id,author_name:USER.user_metadata.display_name,created_at:new Date().toISOString()};
          state.comments.unshift(row);return json([row],201);
        }
        if(request.method()==='DELETE'){
          const id=url.searchParams.get('id')?.slice(3);state.deleted.push(id);
          const removed=state.comments.filter(row=>row.id===id);state.comments=state.comments.filter(row=>row.id!==id);return json(removed);
        }
        const id=url.searchParams.get('track_id')?.slice(3);
        let result=state.comments.filter(row=>!id || row.track_id===Number(id));
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
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin);await expect(page.locator('.track:visible')).toHaveCount(5);
  await expect(page.locator('#confirmedCount')).toHaveText('1');
  if(signedIn)await expect(page.locator('#modeLabel')).toHaveText(admin?'管理员':'已登录');
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
test('five Medieval works load matching samples, with safe external links and no autoplay',async t=>{
  const {page,state}=await app(t);
  for(let id=1;id<=5;id++) {
    const row=page.locator(`#track-${id}`);
    const youtube=row.locator('.youtube');const spotify=row.locator('.spotify');
    assert.match(await youtube.getAttribute('href'),/^https:\/\/www.youtube.com\/results\?search_query=/);
    assert.match(await spotify.getAttribute('href'),/^https:\/\/open.spotify.com\/search\//);
    assert.equal(await youtube.getAttribute('target'),'_blank');
    await row.locator('.preview-button').click();await expect(row.locator('audio')).toBeVisible();
    assert.equal(await row.locator('select option').count(),1);
    assert.equal(await row.locator('audio').evaluate(audio=>audio.paused),true);
    assert.match(await row.locator('audio').getAttribute('src'),new RegExp(`test-${id}`));
  }
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
  assert.equal(state.signups[0].email,'listener@example.com');
  await expect(page.locator('#modeLabel')).toHaveText('访客');await expect(page.locator('#activationBlock')).toBeHidden();
  assert.equal(await page.locator('#signupPassword').inputValue(),'');
});
test('ordinary signup with immediate session enables discussion without administrator activation',async t=>{
  const {page}=await app(t,{autoConfirm:true});
  await page.locator('#adminToggle').click();await page.locator('#signupTab').click();
  await page.locator('#signupName').fill('New listener');await page.locator('#signupEmail').fill('listener@example.com');await page.locator('#signupPassword').fill('test-password-123');await page.locator('#signupSubmit').click();
  await expect(page.locator('#modeLabel')).toHaveText('已登录');await expect(page.locator('#authMessage')).toContainText('参与曲目讨论');
  await expect(page.locator('#exportBtn')).toBeHidden();assert.equal(await page.locator('#track-1 .state-btn').isDisabled(),true);
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
  assert.equal(await page.locator('#track-1 .state-btn').isDisabled(),true);
  page.once('dialog',dialog=>dialog.accept());await page.locator('.delete-comment').click();await expect(page.locator('.comment-item')).toHaveCount(0);
  assert.equal(state.deleted.length,1);
});
test('failed comment submissions keep the draft, and a missing table shows no false success',async t=>{
  const {page,state}=await app(t,{signedIn:true,postError:true});
  await page.getByRole('button',{name:'打开第 1 首的评论窗口',exact:true}).click();await expect(page.locator('#postComment')).toBeEnabled();
  await page.locator('#commentBody').fill('Keep my note.');await page.locator('#postComment').click();
  await expect(page.locator('#commentFeedback')).toContainText('15 秒');assert.equal(await page.locator('#commentBody').inputValue(),'Keep my note.');assert.equal(state.posts.length,0);
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
test('administrator can update existing shared progress and notes; export remains available',async t=>{
  const {page,state}=await app(t,{signedIn:true,admin:true});
  await expect(page.locator('#exportBtn')).toBeVisible();
  await page.locator('#track-1 .state-btn').click();
  await expect.poll(()=>state.progress.length).toBeGreaterThan(0);
  assert.equal(state.progress[0][0].status,2);
  await page.locator('#track-1 .note-toggle').click();await page.locator('#track-1 .note-input').fill('New shared note');
  await expect.poll(()=>state.progress.length).toBeGreaterThan(1);
  assert.equal(state.progress.at(-1)[0].note,'New shared note');
  const download=page.waitForEvent('download');await page.locator('#exportBtn').click();assert.match((await download).suggestedFilename(),/DMus_QE/);
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
