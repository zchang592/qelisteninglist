import { data } from './data.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SITE_URL } from './config.js';
import { buildLibrary } from './library.js?v=1.5.0';
import { createAdminController } from './admin.js';
import { createMessagesController } from './messages.js?v=1.5.0';
import { createPresentation } from './presentation.js?v=1.5.0';
import { createFavoritesController } from './favorites.js';
import { createCommentsController } from './comments.js?v=1.5.0';
import { createAccountController } from './account.js?v=1.3.0';
import { randomAvatar } from './avatars.js?v=1.3.0';
import { mountIcons } from './icons.js?v=3';

const API = `${SUPABASE_URL}/rest/v1/listening_progress`;
const PENDING_KEY = 'dmus-qe-listening-cloud-pending-v1';
const STORAGE_KEY = 'dmus-qe-listening-checklist-v1'; // 与旧版兼容，保留原有勾选状态
const NOTES_KEY = 'dmus-qe-listening-notes-v1';
const knownNumbers = new Set(data.flatMap(([, composers]) => composers.flatMap(([,tracks]) => tracks.map(([id]) => id))));
const TOTAL = knownNumbers.size;
const states = Object.create(null);
const notes = Object.create(null);
let storageAvailable = true;
const app = document.getElementById('app');
const stateButtons = new Map();
const pendingRows = Object.create(null);
let cloudReady = false;
let syncing = false;
let cloudFetching = false;
let syncTimer = null;
let retryTimer = null;
let lastCloudError = '';
let queueSerial = 0;
let session = null;
let currentUser = null;
let authGeneration = 0;
let isAdmin = false;
let sessionRefreshPromise = null;
const AUTH_SESSION_KEY = 'dmus-qe-admin-session-v1';


function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toast.hidden = true; }, 2500);
}
function loadStates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return;
    for (const [id, state] of Object.entries(obj)) {
      if (knownNumbers.has(Number(id)) && (state === 1 || state === 2)) states[id] = state;
    }
  } catch (err) {
    storageAvailable = false;
    setCloudStatus('error','本机无法保存缓存','请保持联网并导出进度备份');
  }
}
function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [id, value] of Object.entries(obj)) {
      if (knownNumbers.has(Number(id)) && typeof value === 'string' && value.trim()) notes[id] = value.slice(0, 3000);
    }
  } catch (err) {
    storageAvailable = false;
    setCloudStatus('error','无法读取本机缓存','请检查浏览器存储设置');
  }
}
function persistNotes() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    storageAvailable = false;
    setCloudStatus('error','本机缓存保存失败','请保持联网并导出进度备份');
    notify('本机缓存保存失败，请导出进度备份');
  }
}
function persistStates() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (err) {
    storageAvailable = false;
    setCloudStatus('error','本机缓存保存失败','请保持联网并导出进度备份');
    notify('自动保存失败，请导出进度备份');
  }
}
function renderState(id) {
  const btn = stateButtons.get(id);
  if (!btn) return;
  const state = states[id] || 0;
  btn.dataset.state = String(state);
  const label=document.getElementById(`state-label-${id}`);
  if(label) label.textContent=state===1?'已确认':state===2?'待核对':'未标记';
  btn.textContent = state === 1 ? '✓' : state === 2 ? '—' : '';
  const stateText = state === 1 ? '音频已确认' : state === 2 ? '准确性待核对' : '未标记';
  btn.setAttribute('aria-checked', state === 1 ? 'true' : state === 2 ? 'mixed' : 'false');
  btn.disabled = !isAdmin || !cloudReady;
  btn.setAttribute('aria-label', `第 ${id} 首：${stateText}${isAdmin ? '，点击切换状态' : '，只读'}`);
  btn.title = isAdmin ? `${stateText}（点击切换：空白 → ✓ → — → 空白）` : `${stateText}（访客只读）`;
}
function refreshStats() {
  const values = Object.values(states);
  const confirmed = values.filter(v => v === 1).length;
  const uncertain = values.filter(v => v === 2).length;
  document.getElementById('confirmedCount').textContent = confirmed;
  document.getElementById('uncertainCount').textContent = uncertain;
  document.getElementById('emptyCount').textContent = TOTAL - confirmed - uncertain;
  document.getElementById('confirmedProgress').style.width = `${100 * confirmed / TOTAL}%`;
  document.getElementById('uncertainProgress').style.width = `${100 * uncertain / TOTAL}%`;
}
function changeState(id) {
  if (!isAdmin || !cloudReady) return;
  const next = ((states[id] || 0) + 1) % 3;
  if (next === 0) delete states[id];
  else states[id] = next;
  renderState(id);
  refreshStats();
  persistStates();
  queueTrack(id, false);
}
async function copyToClipboard(value, button, originalLabel) {
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(value); copied = true; } catch (err) { /* local file fallback */ }
  }
  if (!copied) {
    const input = document.createElement('textarea');
    input.value = value;
    input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(input);
    input.focus(); input.select();
    try { copied = document.execCommand('copy'); } catch (err) { copied = false; }
    input.remove();
  }
  button.textContent = copied ? '已复制' : '复制失败';
  button.classList.toggle('copied', copied);
  button.classList.toggle('failed', !copied);
  clearTimeout(button._restoreTimer);
  button._restoreTimer = setTimeout(() => {
    button.textContent = originalLabel;
    button.classList.remove('copied', 'failed');
  }, 1400);
  if (!copied) notify('复制被浏览器阻止，请手动选择文字复制');
}
function makeButton(label, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = label;
  button.title = label === '复制标题' ? '仅复制作品标题/选段，不包含作曲家及编号' : '复制作曲家 + 作品标题，不包含编号';
  button.addEventListener('click', () => copyToClipboard(value, button, label));
  return button;
}
let library;
function buildUI() {
  library=buildLibrary({data,app,favorites,makeButton,openComments:id=>comments.open(id),openAuth:()=>toggleAuth(true)});
  refreshStats();
}
function setAll(open) {library.setAll(open);}
function exportProgress() {
  if (!isAdmin || !cloudReady) { notify('请先同步原有进度后再导出备份'); return; }
  const backup = { format: 'DMus-QE-listening-progress', version: 1, exportedAt: new Date().toISOString(), statuses: { ...states } };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QE_Listening_List_听辨进度_${new Date().toISOString().slice(0,10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('勾选状态备份已导出');
}
async function importProgress(file) {
  if (!isAdmin) { notify('只有管理员能导入备份'); return; }
  if (!cloudReady) { notify('请先同步原有进度后再导入备份'); return; }
  try {
    if (file.size > 2000000) throw new Error('备份文件过大');
    const raw = await file.text();
    const backup = JSON.parse(raw);
    if (!backup || backup.format !== 'DMus-QE-listening-progress' || ![1, 2].includes(backup.version) ||
        !backup.statuses || typeof backup.statuses !== 'object' || Array.isArray(backup.statuses)) {
      throw new Error('不是有效的听辨目录进度备份');
    }
    const importedStates = Object.create(null);
    for (const [id, state] of Object.entries(backup.statuses)) {
      if (!knownNumbers.has(Number(id)) || (state !== 1 && state !== 2)) {
        throw new Error('备份包含无效的曲目编号或勾选状态');
      }
      importedStates[id] = state;
    }
    if (Object.keys(states).length && !confirm('导入将覆盖当前勾选状态。是否继续？')) return;
    for (const id of Object.keys(states)) delete states[id];
    Object.assign(states, importedStates);
    for (const id of knownNumbers) renderState(id);
    refreshStats();
    persistStates();
    queueAllTracks();
    notify('备份已导入；正在将 160 项进度同步到云端');
  } catch (err) {
    notify(err.message || '导入失败，请检查文件');
  }
}

// 私有进度仅管理员读取。旧备注留在数据库中，但不再显示或编辑。
function setCloudStatus(mode, message, detail='') {
  const label = document.getElementById('syncStatus');
  label.dataset.mode = mode;
  label.textContent = message;
  if (detail) document.getElementById('syncDetail').textContent = detail;
}
function cacheSnapshot() {
  persistStates();
  persistNotes();
}
function loadPending() {
  if (!isAdmin) return;
  try {
    const obj = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [id, item] of Object.entries(obj)) {
      if (!knownNumbers.has(Number(id)) || !item || typeof item !== 'object') continue;
      if (![0,1,2].includes(item.status) || typeof item.note !== 'string' || item.note.length > 3000) continue;
      // Preserve unsent notes from earlier versions, without reintroducing note editing.
      pendingRows[id] = {status:item.status, note:item.note, legacyNote:item.legacyNote!==false, revision:++queueSerial};
      applyTrackToUI(id, item.status, item.note);
    }
  } catch { notify('未能读取离线待同步数据，请检查 JSON 备份'); }
}
function storePending() {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(pendingRows)); }
  catch { setCloudStatus('error', '无法缓存待同步修改', '建议立即导出 JSON 备份'); }
}
function pendingCount() { return Object.keys(pendingRows).length; }
function applyTrackToUI(id, status, note) {
  if (status === 1 || status === 2) states[id] = status;
  else delete states[id];
  if (note && note.trim()) notes[id] = note;
  else delete notes[id];
  renderState(Number(id));
}
function redrawAll() {
  for (const id of knownNumbers) renderState(id);
  refreshStats();
}
function queueTrack(id, delayed=false) {
  if (!isAdmin) return;
  const previous=pendingRows[id];
  pendingRows[id] = {status:states[id] || 0, note:previous?.legacyNote?previous.note:(notes[id] || ''), legacyNote:!!previous?.legacyNote, revision:++queueSerial};
  storePending();
  const n = pendingCount();
  setCloudStatus('pending', `待同步 ${n} 项`, '修改已暂存在本机，将自动上传');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(flushPending, delayed ? 750 : 160);
}
function queueAllTracks() {
  if (!isAdmin) return;
  for (const id of knownNumbers) {
    const previous=pendingRows[id];
    pendingRows[id]={status:states[id] || 0,note:previous?.legacyNote?previous.note:(notes[id] || ''),legacyNote:!!previous?.legacyNote,revision:++queueSerial};
  }
  storePending();
  setCloudStatus('pending', `待同步 ${pendingCount()} 项`, '正在同步导入的备份数据');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(flushPending, 100);
}
function requestHeaders(isPost=false, withAuth=false) {
  const h = {'apikey': SUPABASE_PUBLISHABLE_KEY, 'Accept':'application/json'};
  if (withAuth && session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
  if (isPost) {
    h['Content-Type']='application/json';
    h['Prefer']='resolution=merge-duplicates,return=minimal';
  }
  return h;
}
async function apiFetch(url, options={}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {...options, signal:controller.signal, cache:'no-store'});
    if (!response.ok) {
      const body = await response.text();
      let message=body.slice(0,180);
      let code='';
      try { const json=JSON.parse(body); message=json.message || json.error_description || json.msg || json.details || message; code=json.code || ''; } catch {}
      const error=new Error(`HTTP ${response.status}: ${message}`); error.status=response.status; error.code=code; throw error;
    }
    return response;
  } finally { clearTimeout(timer); }
}
async function flushPending() {
  if (!isAdmin || syncing || cloudFetching || !pendingCount()) return;
  syncing = true;
  clearTimeout(retryTimer);
  setCloudStatus('busy', '正在上传云端…', `${pendingCount()} 项修改等待保存`);
  try {
    while (isAdmin && pendingCount()) {
      const accessToken = await validAccessToken();
      if (!accessToken) throw new Error('管理员登录已失效，请重新登录');
      const generation=authGeneration;
      const batch=Object.entries(pendingRows).slice(0,6);
      const results=await Promise.allSettled(batch.map(async([id,item])=>{
        const target=`${API}?track_id=eq.${encodeURIComponent(id)}`;
        const patchHeaders={apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',Accept:'application/json',Prefer:'return=representation'};
        const payload={status:item.status,updated_at:new Date().toISOString(),...(item.legacyNote?{note:item.note}: {})};
        const patch=async()=>{
          const response=await apiFetch(target,{method:'PATCH',headers:patchHeaders,body:JSON.stringify(payload)});
          const changed=await response.json();
          if(!Array.isArray(changed))throw new Error('无法确认进度是否保存');
          return changed.length;
        };
        if(await patch())return;
        if(generation!==authGeneration || !isAdmin)throw new Error('管理员登录已失效');
        // New rows need a note value on older schemas; existing notes are never changed by status-only edits.
        await apiFetch(`${API}?on_conflict=track_id`,{method:'POST',headers:{...patchHeaders,Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({track_id:Number(id),status:item.status,note:item.note || '',updated_at:payload.updated_at})});
        if(generation!==authGeneration || !isAdmin)throw new Error('管理员登录已失效');
        if(!await patch())throw new Error('无法确认进度是否保存');
      }));
      if(generation!==authGeneration || !isAdmin)break;
      for(let index=0;index<batch.length;index++){
        const [id,item]=batch[index];
        if(results[index].status==='fulfilled' && pendingRows[id]?.revision===item.revision)delete pendingRows[id];
      }
      storePending();
      const failed=results.find(result=>result.status==='rejected');
      if(failed)throw failed.reason;
    }
    if(!isAdmin)return;
    lastCloudError='';
    setCloudStatus('ok', '已同步至云端', `全部修改已保存 · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`);
  } catch(err) {
    lastCloudError = String(err.message || err);
    setCloudStatus('error', `待同步 ${pendingCount()} 项`, '云端连接失败，修改已缓存在本机；联网后会重试');
    clearTimeout(retryTimer);
    if (isAdmin && !/HTTP 40[13]|登录已失效/.test(lastCloudError)) retryTimer=setTimeout(flushPending, 16000);
  } finally {
    syncing=false;
    if (isAdmin && pendingCount() && !lastCloudError) {
      clearTimeout(syncTimer);
      syncTimer=setTimeout(flushPending, 200);
    }
  }
}
async function loadCloud(silent=false) {
  if (!isAdmin) return;
  if (cloudFetching || syncing) return;
  const generation=authGeneration;
  cloudFetching = true;
  if (!silent) setCloudStatus('busy', '正在读取云端…', '正在刷新整理进度');
  try {
    const token=await validAccessToken();
    if(!token || generation!==authGeneration || !isAdmin) return;
    const response = await apiFetch(`${API}?select=track_id,status,note,updated_at&order=track_id.asc`, {headers:requestHeaders(false,true)});
    const rows = await response.json();
    if(generation!==authGeneration || !isAdmin) return;
    if (!Array.isArray(rows)) throw new Error('服务器返回的数据格式不正确');
    // 服务器数据为基准，尚未同步的管理员修改优先。
    const remote = new Map(rows.map(row => [String(row.track_id),row]));
    for (const id of knownNumbers) {
      const r=remote.get(String(id));
      const pending = isAdmin ? pendingRows[id] : null;
      if(pending && !pending.legacyNote && r)pending.note=r.note || '';
      const preservedNote=pending?.legacyNote?pending.note:(r?.note || pending?.note || '');
      applyTrackToUI(id, pending ? pending.status : (r?.status || 0), preservedNote);
    }
    cloudReady=true;
    redrawAll();
    cacheSnapshot();
    lastCloudError='';
    if (pendingCount()) {
      setCloudStatus('pending', `待同步 ${pendingCount()} 项`, '云端已连接，正在提交本机修改');
    } else {
      setCloudStatus('ok', '云端数据已更新', `读取成功 · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`);
    }
  } catch(err) {
    lastCloudError=String(err.message || err);
    if(isAdmin) setCloudStatus('error', '无法读取云端', '请检查网络并点击立即同步');
    // The persistent status presents connection errors without interrupting listening.
  } finally {
    cloudFetching=false;
    if (isAdmin && pendingCount()) flushPending();
  }
}
async function manualSync() {
  clearTimeout(syncTimer);
  if (isAdmin && pendingCount()) {
    await flushPending();
    if (pendingCount()) { notify('仍有未同步项，请检查网络后重试'); return; }
  }
  await loadCloud(false);
}

// Supabase Auth is shared by regular listeners and the existing administrator role.
function authFeedback(message, error=false) {
  const el=document.getElementById('authMessage');
  el.textContent=message;
  el.classList.toggle('error',error);
}
function saveSession(value) {
  if (!value?.access_token || !value?.refresh_token) throw new Error('登录返回结果不完整，请重试');
  session={access_token:value.access_token, refresh_token:value.refresh_token,
    expires_at:value.expires_at || Math.floor(Date.now()/1000)+(value.expires_in || 3600)};
  if(value.user) currentUser=value.user;
  try {localStorage.setItem(AUTH_SESSION_KEY,JSON.stringify(session));} catch { /* in-memory sign-in still works */ }
}
async function authRequest(path,body=null,token=null,method=null) {
  const headers={apikey:SUPABASE_PUBLISHABLE_KEY,Accept:'application/json'};
  if(body!==null) headers['Content-Type']='application/json';
  if(token) headers.Authorization=`Bearer ${token}`;
  const response=await apiFetch(`${SUPABASE_URL}/auth/v1${path}`,{method:method || (body!==null?'POST':'GET'),headers,...(body!==null?{body:JSON.stringify(body)}:{})});
  return response.status===204?{}:await response.json();
}
async function validAccessToken() {
  if(!session?.refresh_token) return null;
  if(session.access_token && session.expires_at*1000>Date.now()+60000) return session.access_token;
  if(!sessionRefreshPromise) {
    const generation=authGeneration;
    const refreshToken=session.refresh_token;
    sessionRefreshPromise=(async()=>{
      try {
        const refreshed=await authRequest('/token?grant_type=refresh_token',{refresh_token:refreshToken});
        if(generation!==authGeneration) return null;
        saveSession(refreshed);return session.access_token;
      } catch(error) {
        if(generation!==authGeneration) return null;
        // A transient connection error must not erase a valid refresh token.
        if(error.status===400 || error.status===401 || error.status===403) {
          session=null;currentUser=null;authGeneration++;
          try{localStorage.removeItem(AUTH_SESSION_KEY);}catch{}
          setAdmin(false);
          authFeedback('登录已过期，请重新登录。',true);
        }
        return null;
      }
    })().finally(()=>{sessionRefreshPromise=null;});
  }
  return sessionRefreshPromise;
}
function setAdmin(value) {
  isAdmin=!!value && !!currentUser && !!session;
  if(!isAdmin) cloudReady=false;
  document.body.classList.toggle('is-admin',isAdmin);
  const signedIn=!!currentUser && !!session;
  document.getElementById('modeLabel').textContent=isAdmin?'管理员':signedIn?'已登录':'访客';
  document.getElementById('modeLabel').classList.toggle('admin',isAdmin);
  document.getElementById('accountButtonLabel').textContent=signedIn?'我的账号':'登录 / 注册';
  document.getElementById('adminToggle').hidden=signedIn;
  document.getElementById('logoutBtn').hidden=true;
  document.getElementById('authTabs').hidden=signedIn;
  document.getElementById('loginForm').hidden=signedIn || document.getElementById('signupTab').getAttribute('aria-pressed')==='true';
  document.getElementById('signupForm').hidden=signedIn || document.getElementById('signupTab').getAttribute('aria-pressed')!=='true';
  document.getElementById('signedInView').hidden=!signedIn;
  document.getElementById('activationBlock').hidden=!signedIn || isAdmin;
  document.getElementById('authTitle').textContent=signedIn?'你的听辨账号':'欢迎来到听辨室';
  document.getElementById('authDescription').textContent=signedIn?'每首作品下的讨论按钮，都通向它独立的评论窗口。':'注册一个账号，和其他听者交流作品与录音版本。';
  document.getElementById('accountName').textContent=currentUser?.user_metadata?.display_name || '听者';
  document.getElementById('accountRole').textContent=isAdmin?'管理员 · 可以管理整理进度':'已登录 · 可以收藏和参与讨论';
  document.getElementById('profileAdminProgress').hidden=!isAdmin;
  document.getElementById('profileSiteSettings').hidden=!isAdmin;
  document.getElementById('profileMessages').hidden=!isAdmin;
  for(const id of knownNumbers)renderState(id);
  if(!isAdmin){clearTimeout(syncTimer);clearTimeout(retryTimer);admin.clear();messages.reset();}
  else messages.refresh();
  comments.updateAuth();
  account.render();
  favorites.userChanged();
}
async function checkAdminAccess() {
  const generation=authGeneration;
  const token=await validAccessToken();
  if(!token || !currentUser){setAdmin(false);return false;}
  try {
    const response=await apiFetch(`${SUPABASE_URL}/rest/v1/rpc/am_i_qe_admin`,{method:'POST',headers:{...requestHeaders(false,true),'Content-Type':'application/json'},body:'{}'});
    const admin=(await response.json())===true;
    if(generation!==authGeneration) return false;
    setAdmin(admin);
  } catch {if(generation===authGeneration) setAdmin(false);}
  return isAdmin;
}
async function restoreAuth() {
  const generation=authGeneration;
  try {
    const hash=new URLSearchParams(location.hash.replace(/^#/,''));
    if(hash.get('error_description')) {
      authFeedback(hash.get('error_description'),true);
      history.replaceState(null,'',location.pathname+location.search);
      toggleAuth(true);return;
    }
    if(hash.get('access_token') && hash.get('refresh_token')) {
      saveSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_in:Number(hash.get('expires_in')||3600)});
      history.replaceState(null,'',location.pathname+location.search);
    } else {
      const stored=localStorage.getItem(AUTH_SESSION_KEY);
      if(stored) session=JSON.parse(stored);
    }
    if(!session){setAdmin(false);return;}
    const token=await validAccessToken();
    if(!token || generation!==authGeneration) return;
    const user=await authRequest('/user',null,token);
    if(generation!==authGeneration) return;
    currentUser=user;
    const access=await checkAdminAccess();
    if(access){loadStates();loadNotes();loadPending();await loadCloud(true);if(pendingCount()) flushPending();}
  } catch {
    if(generation!==authGeneration) return;
    currentUser=null;setAdmin(false);
    authFeedback('暂时无法恢复登录，请检查网络或重新登录。',true);
  }
}
function switchAuth(mode) {
  document.getElementById('loginTab').setAttribute('aria-pressed',String(mode==='login'));
  document.getElementById('signupTab').setAttribute('aria-pressed',String(mode==='signup'));
  document.getElementById('loginForm').hidden=mode!=='login';
  document.getElementById('signupForm').hidden=mode!=='signup';
  authFeedback('');
}
function toggleAuth(open) {
  const dialog=document.getElementById('authPanel');
  if(open && !dialog.open) dialog.showModal();
  else if(!open && dialog.open) dialog.close();
}
async function signIn(email,password) {
  authGeneration++;
  const result=await authRequest('/token?grant_type=password',{email,password});
  saveSession(result);
  if(!currentUser) currentUser=await authRequest('/user',null,session.access_token);
  const admin=await checkAdminAccess();
  document.getElementById('loginPassword').value='';
  if(admin){loadStates();loadNotes();loadPending();await loadCloud(true);if(pendingCount()) flushPending();}
  toggleAuth(false);
  notify(admin?'管理员已登录':'登录成功，可以参与曲目讨论了');
}
async function signUp(email,password,name,invite) {
  if(name.length<2 || name.length>40) throw new Error('公开昵称需要 2–40 个字，请重新填写。');
  if(!invite) throw new Error('请填写管理员提供的邀请码。');
  if(!presentation.isReady()) throw new Error('注册服务暂未就绪，请稍后重试。');
  authGeneration++;
  const target=location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname) ? location.origin+location.pathname : SITE_URL;
  let result;
  try {result=await authRequest(`/signup?redirect_to=${encodeURIComponent(target)}`,{email,password,data:{display_name:name,avatar_key:randomAvatar(),invite_code:invite}});}
  catch(error){if(error.status===500)throw new Error('注册失败，请核对邀请码是否有效、尚未使用，并稍后重试。');throw error;}
  document.getElementById('signupPassword').value='';
  document.getElementById('signupInvite').value='';
  if(result.access_token){
    saveSession(result);
    if(!currentUser) currentUser=await authRequest('/user',null,session.access_token);
    await checkAdminAccess();
    authFeedback('注册成功，已登录。你现在可以参与曲目讨论。');
  } else {
    authFeedback('注册请求已提交。请查看邮箱中的确认邮件，确认后返回本站登录；如果已有账号，请直接登录。');
  }
}
async function claimAdmin() {
  const token=await validAccessToken();if(!token) throw new Error('请先登录账号');
  const code=document.getElementById('activationCode').value.trim();if(!code) throw new Error('请填写管理员激活码');
  await apiFetch(`${SUPABASE_URL}/rest/v1/rpc/claim_qe_admin`,{method:'POST',headers:{...requestHeaders(false,true),'Content-Type':'application/json'},body:JSON.stringify({activation_code:code})});
  document.getElementById('activationCode').value='';
  if(!await checkAdminAccess()) throw new Error('权限检测失败，请重新登录后核对');
  toggleAuth(false);loadStates();loadNotes();loadPending();await loadCloud(true);if(pendingCount()) flushPending();notify('管理员权限已激活');
}
async function signOut() {
  const previous=session?.access_token;
  authGeneration++;session=null;currentUser=null;
  try{localStorage.removeItem(AUTH_SESSION_KEY);}catch{}
  setAdmin(false);toggleAuth(false);
  // Keep unsent administrator edits in their existing local queue.
  for(const id of Object.keys(states))delete states[id];
  for(const id of Object.keys(notes))delete notes[id];
  refreshStats();
  if(previous) authRequest('/logout',{},previous).catch(()=>{});
  notify('已退出账号');
}
async function updateAccountProfile(changes) {
  const generation=authGeneration;
  const userId=currentUser?.id;
  const token=await validAccessToken();
  if(!token || !userId || currentUser?.id!==userId) throw new Error('请重新登录后修改资料。');
  const result=await authRequest('/user',{data:{...currentUser.user_metadata,...changes}},token,'PUT');
  const updated=result.user || result;
  if(generation!==authGeneration || currentUser?.id!==userId) throw new Error('账号状态已变化，请重新登录。');
  if(updated.id!==userId) throw new Error('未能确认资料是否保存，请重试。');
  currentUser=updated;
  setAdmin(isAdmin);
  comments.updateProfile(updated);
}
const comments=createCommentsController({data,getUser:()=>currentUser,getToken:validAccessToken,openAuth:()=>toggleAuth(true),apiFetch,notify});
const favorites=createFavoritesController({getUser:()=>currentUser,getToken:validAccessToken,openAuth:()=>toggleAuth(true),apiFetch,notify});
const admin=createAdminController({data,stateButtons,isAdmin:()=>isAdmin,changeState,renderState,refreshStats});
const messages=createMessagesController({isAdmin:()=>isAdmin,getUser:()=>currentUser,getToken:validAccessToken,apiFetch,openComment:row=>comments.openComment(row)});
const account=createAccountController({getUser:()=>currentUser,updateProfile:updateAccountProfile,openAuth:()=>toggleAuth(true),openAdmin:()=>admin.open(),openMessages:()=>messages.open(),signOut});
mountIcons();
buildUI();setAdmin(false);refreshStats();restoreAuth();
const presentation=createPresentation({getToken:validAccessToken,isAdmin:()=>isAdmin,apiFetch,notify});

document.getElementById('adminToggle').addEventListener('click',()=>toggleAuth(true));
document.getElementById('closeAuth').addEventListener('click',()=>toggleAuth(false));
document.getElementById('loginTab').addEventListener('click',()=>switchAuth('login'));
document.getElementById('signupTab').addEventListener('click',()=>switchAuth('signup'));
document.getElementById('logoutBtn').addEventListener('click',()=>signOut());
document.getElementById('accountLogout').addEventListener('click',()=>signOut());
document.getElementById('communityBtn').addEventListener('click',()=>comments.open());
let authSubmitting=false;
for(const [formId,submitId,handler] of [
 ['loginForm','loginSubmit',()=>signIn(document.getElementById('loginEmail').value.trim(),document.getElementById('loginPassword').value)],
 ['signupForm','signupSubmit',()=>signUp(document.getElementById('signupEmail').value.trim(),document.getElementById('signupPassword').value,document.getElementById('signupName').value.trim(),document.getElementById('signupInvite').value.trim())],
 ['activationForm',null,claimAdmin]
]) document.getElementById(formId).addEventListener('submit',async event=>{
  event.preventDefault();if(authSubmitting) return;authSubmitting=true;
  const button=submitId?document.getElementById(submitId):event.submitter;
  const controls=[button,...['loginSubmit','signupSubmit','loginTab','signupTab'].map(id=>document.getElementById(id))];
  controls.forEach(control=>{control.disabled=true;});authFeedback('正在提交…');
  try{await handler();}catch(error){authFeedback(error.message || '提交失败，请稍后重试。',true);}
  finally{authSubmitting=false;controls.forEach(control=>{control.disabled=false;});}
});
window.addEventListener('online',()=>{if(isAdmin && pendingCount()) flushPending();else if(isAdmin)loadCloud(true);if(currentUser && favorites.snapshot().error)favorites.load();});
document.addEventListener('visibilitychange',()=>{if(isAdmin && !document.hidden && !pendingCount() && !syncing) loadCloud(true);});
setInterval(()=>{if(isAdmin && !document.hidden && !syncing && !pendingCount()) loadCloud(true);},45000);
setInterval(()=>{if(session) validAccessToken();},60000);
document.getElementById('syncBtn').addEventListener('click',manualSync);
document.getElementById('expandBtn').addEventListener('click',()=>setAll(true));
document.getElementById('collapseBtn').addEventListener('click',()=>setAll(false));
document.getElementById('exportBtn').addEventListener('click',()=>{if(isAdmin) exportProgress();});
document.getElementById('importBtn').addEventListener('click',()=>{if(isAdmin) document.getElementById('importFile').click();});
document.getElementById('importFile').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(file) await importProgress(file);});
