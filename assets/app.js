import { data } from './data.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SITE_URL } from './config.js';
import { buildLibrary } from './library.js';
import { createCommentsController } from './comments.js?v=2';
import { createAccountController } from './account.js';
import { randomAvatar } from './avatars.js';
import { mountIcons } from './icons.js';

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
const noteControls = new Map();
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
    document.getElementById('storageNote').textContent = '此浏览器不允许自动保存本地数据。请使用「导出进度与备注」备份。';
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
    document.getElementById('storageNote').textContent = '浏览器无法读取备注或勾选数据，请使用「导出进度与备注」保存备份。';
  }
}
function persistNotes() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    storageAvailable = false;
    document.getElementById('storageNote').textContent = '自动保存失败，请立即使用「导出进度与备注」备份。';
    notify('备注自动保存失败，请导出备份');
  }
}
function renderNote(id) {
  const ui = noteControls.get(id);
  if (!ui) return;
  const filled = Boolean(notes[id] && notes[id].trim());
  ui.button.classList.toggle('has-note', filled);
  ui.button.textContent = filled ? '备注 · 已写' : '备注';
  ui.button.title = isAdmin ? (filled ? '查看或编辑备注' : '添加备注') : '查看备注（访客只读）';
  ui.input.readOnly = !isAdmin;
  if (document.activeElement !== ui.input) ui.input.value = notes[id] || '';
}
function updateNote(id, text) {
  if (!isAdmin) return;
  if (text.trim()) notes[id] = text;
  else delete notes[id];
  renderNote(id);
  refreshStats();
  persistNotes();
  queueTrack(id, true);
}
function persistStates() {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (err) {
    storageAvailable = false;
    document.getElementById('storageNote').textContent = '自动保存失败，请使用「导出进度与备注」备份。';
    notify('自动保存失败，请导出进度与备注备份');
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
  document.getElementById('notesCount').textContent = Object.keys(notes).length;
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
function makeSummary(name, count, suffix) {
  const summary = document.createElement('summary');
  const label = document.createElement('span');
  label.textContent = name;
  const countSpan = document.createElement('span');
  countSpan.className = 'count';
  countSpan.textContent = `${count} ${suffix}`;
  summary.append(label, countSpan);
  return summary;
}
function buildUI() {
  buildLibrary({data, app, stateButtons, noteControls, isAdmin:()=>isAdmin, changeState, updateNote, makeButton, openComments:id=>comments.open(id)});
  for (const id of knownNumbers) { renderState(id); renderNote(id); }
  refreshStats();
}
function setAll(open) {
  app.querySelectorAll('details').forEach(el => { el.open = open; });
  if(!open) app.querySelectorAll('audio').forEach(audio=>audio.pause());
}
function exportProgress() {
  const backup = { format: 'DMus-QE-listening-progress', version: 2, exportedAt: new Date().toISOString(), statuses: { ...states }, notes: { ...notes } };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DMus_QE_听辨进度_${new Date().toISOString().slice(0,10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('勾选状态及备注备份已导出');
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
    let importedNotes = null;
    if (backup.version === 2) {
      if (!backup.notes || typeof backup.notes !== 'object' || Array.isArray(backup.notes)) {
        throw new Error('备份缺少有效的备注数据');
      }
      importedNotes = Object.create(null);
      for (const [id, value] of Object.entries(backup.notes)) {
        if (!knownNumbers.has(Number(id)) || typeof value !== 'string' || value.length > 3000) {
          throw new Error('备份包含无效的备注');
        }
        if (value.trim()) importedNotes[id] = value;
      }
    }
    const hasExisting = Object.keys(states).length > 0 ||
      (importedNotes !== null && Object.keys(notes).length > 0);
    if (hasExisting && !confirm(importedNotes === null
      ? '这是旧版进度备份：将覆盖当前勾选状态，但保留现有备注。是否继续？'
      : '导入将覆盖当前所有勾选状态和备注。是否继续？')) return;
    for (const id of Object.keys(states)) delete states[id];
    Object.assign(states, importedStates);
    if (importedNotes !== null) {
      for (const id of Object.keys(notes)) delete notes[id];
      Object.assign(notes, importedNotes);
    }
    for (const id of knownNumbers) { renderState(id); renderNote(id); }
    refreshStats();
    persistStates();
    if (importedNotes !== null) persistNotes();
    queueAllTracks();
    notify('备份已导入；正在将 160 项进度同步到云端');
  } catch (err) {
    notify(err.message || '导入失败，请检查文件');
  }
}

// 云端共享进度。游客只读，由 Supabase RLS 限制写入；管理员启用本机待传队列。
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
      pendingRows[id] = {status:item.status, note:item.note, revision:++queueSerial};
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
  renderNote(Number(id));
}
function redrawAll() {
  for (const id of knownNumbers) { renderState(id); renderNote(id); }
  refreshStats();
}
function queueTrack(id, delayed=false) {
  if (!isAdmin) return;
  pendingRows[id] = {status: states[id] || 0, note: notes[id] || '', revision: ++queueSerial};
  storePending();
  const n = pendingCount();
  setCloudStatus('pending', `待同步 ${n} 项`, '修改已暂存在本机，将自动上传');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(flushPending, delayed ? 750 : 160);
}
function queueAllTracks() {
  if (!isAdmin) return;
  for (const id of knownNumbers) pendingRows[id] = {status:states[id] || 0, note:notes[id] || '', revision:++queueSerial};
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
      const batch = Object.entries(pendingRows).slice(0,40);
      const payload = batch.map(([id, r]) => ({track_id:Number(id), status:r.status, note:r.note, updated_at:new Date().toISOString()}));
      await apiFetch(`${API}?on_conflict=track_id`, {
        method:'POST', headers:requestHeaders(true,true), body:JSON.stringify(payload)
      });
      for (const [id, item] of batch) {
        if (pendingRows[id] && pendingRows[id].revision === item.revision) delete pendingRows[id];
      }
      storePending();
    }
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
  if (!silent) setCloudStatus('busy', '正在读取云端…', '正在刷新共享进度与备注');
  try {
    const token=await validAccessToken();
    if(!token || generation!==authGeneration || !isAdmin) return;
    const response = await apiFetch(`${API}?select=track_id,status,note,updated_at&order=track_id.asc`, {headers:requestHeaders(false,true)});
    const rows = await response.json();
    if(generation!==authGeneration || !isAdmin) return;
    if (!Array.isArray(rows)) throw new Error('服务器返回的数据格式不正确');
    // 服务器数据始终为基准。访客绝不能把旧版 localStorage 内容推送到服务器。
    const remote = new Map(rows.map(row => [String(row.track_id),row]));
    for (const id of knownNumbers) {
      const r=remote.get(String(id));
      const pending = isAdmin ? pendingRows[id] : null;
      applyTrackToUI(id, pending ? pending.status : (r?.status || 0), pending ? pending.note : (r?.note || ''));
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
    setCloudStatus('error', '无法读取云端', isAdmin ? '云端连接失败；管理员离线修改暂存本机' : '云端连接失败，请检查网络后重试');
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
  document.getElementById('accountRole').textContent=isAdmin?'管理员 · 可以维护共享进度与备注':'已登录 · 可以参与讨论';
  document.getElementById('exportBtn').hidden=!isAdmin;
  document.getElementById('importBtn').hidden=!isAdmin;
  document.getElementById('stateHelp').textContent=isAdmin?'点击方框，切换未标记 / 已确认 / 待核对。':'共享进度与备注由管理员维护。';
  document.getElementById('storageNote').textContent=isAdmin?'修改自动同步云端，断网时暂存本机。建议定期导出进度与备注备份。':signedIn?'已登录，可以参与每首作品的讨论；共享进度与备注由管理员维护。':'访客可浏览全部作品；注册并登录后可参与曲目讨论。';
  for(const id of knownNumbers){renderState(id);renderNote(id);}
  if(!isAdmin){clearTimeout(syncTimer);clearTimeout(retryTimer);}
  comments.updateAuth();
  account.render();
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
    if(access){loadPending();await loadCloud(true);if(pendingCount()) flushPending();}
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
  if(admin){loadPending();await loadCloud(true);if(pendingCount()) flushPending();}
  toggleAuth(false);
  notify(admin?'管理员已登录':'登录成功，可以参与曲目讨论了');
}
async function signUp(email,password,name) {
  if(name.length<2 || name.length>40) throw new Error('公开昵称需要 2–40 个字，请重新填写。');
  authGeneration++;
  const target=location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname) ? location.origin+location.pathname : SITE_URL;
  const result=await authRequest(`/signup?redirect_to=${encodeURIComponent(target)}`,{email,password,data:{display_name:name,avatar_key:randomAvatar()}});
  document.getElementById('signupPassword').value='';
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
  toggleAuth(false);loadPending();await loadCloud(true);if(pendingCount()) flushPending();notify('管理员权限已激活');
}
async function signOut() {
  const previous=session?.access_token;
  authGeneration++;session=null;currentUser=null;
  try{localStorage.removeItem(AUTH_SESSION_KEY);}catch{}
  setAdmin(false);toggleAuth(false);
  // Keep other accounts' unsent administrator edits in their existing local queue.
  loadCloud(true);
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
const account=createAccountController({getUser:()=>currentUser,updateProfile:updateAccountProfile,openAuth:()=>toggleAuth(true),signOut});
mountIcons();
loadStates();loadNotes();buildUI();setAdmin(false);refreshStats();loadCloud();restoreAuth();

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
 ['signupForm','signupSubmit',()=>signUp(document.getElementById('signupEmail').value.trim(),document.getElementById('signupPassword').value,document.getElementById('signupName').value.trim())],
 ['activationForm',null,claimAdmin]
]) document.getElementById(formId).addEventListener('submit',async event=>{
  event.preventDefault();if(authSubmitting) return;authSubmitting=true;
  const button=submitId?document.getElementById(submitId):event.submitter;
  const controls=[button,...['loginSubmit','signupSubmit','loginTab','signupTab'].map(id=>document.getElementById(id))];
  controls.forEach(control=>{control.disabled=true;});authFeedback('正在提交…');
  try{await handler();}catch(error){authFeedback(error.message || '提交失败，请稍后重试。',true);}
  finally{authSubmitting=false;controls.forEach(control=>{control.disabled=false;});}
});
window.addEventListener('online',()=>{if(isAdmin && pendingCount()) flushPending();else loadCloud(true);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden && !pendingCount() && !syncing) loadCloud(true);});
setInterval(()=>{if(!document.hidden && !syncing && (!isAdmin || !pendingCount())) loadCloud(true);},45000);
setInterval(()=>{if(session) validAccessToken();},60000);
document.getElementById('syncBtn').addEventListener('click',manualSync);
document.getElementById('expandBtn').addEventListener('click',()=>setAll(true));
document.getElementById('collapseBtn').addEventListener('click',()=>setAll(false));
document.getElementById('exportBtn').addEventListener('click',()=>{if(isAdmin) exportProgress();});
document.getElementById('importBtn').addEventListener('click',()=>{if(isAdmin) document.getElementById('importFile').click();});
document.getElementById('importFile').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(file) await importProgress(file);});
