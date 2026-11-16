import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
import { icon } from './icons.js';

const ENDPOINT = `${SUPABASE_URL}/rest/v1/listening_comments`;
const $ = id => document.getElementById(id);
const PAGE_SIZE = 20;

export function createCommentsController({data, getUser, getToken, openAuth, apiFetch, notify}) {
  const tracks = new Map(data.flatMap(([,composers])=>composers.flatMap(([,tracks])=>tracks)));
  const dialog = $('commentsDialog');
  const select = $('commentTrack');
  const body = $('commentBody');
  const form = $('commentForm');
  const list = $('commentsList');
  const drafts = new Map();
  let activeTrack = null;
  let generation = 0;
  let cursor = null;
  let sending = false;
  let ready = false;
  let rows = [];
  let author = getUser()?.id || null;
  const all = document.createElement('option'); all.value=''; all.textContent='全部曲目 · 选择作品后可发表评论'; select.append(all);
  for (const [id,title] of tracks) {
    const option=document.createElement('option'); option.value=id; option.textContent=`${id}. ${title}`; select.append(option);
  }
  function headers(token) {
    return {apikey:SUPABASE_PUBLISHABLE_KEY, Accept:'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})};
  }
  function feedback(message='',error=false) {
    $('commentFeedback').textContent=message;
    $('commentFeedback').classList.toggle('error',error);
  }
  function saveDraft() { if (activeTrack) drafts.set(activeTrack,body.value); }
  function updateCounter() { $('commentCounter').textContent=`${body.value.length} / 2000`; }
  function updateAuth() {
    const user=getUser();
    if ((user?.id || null)!==author) {
      // A shared browser must not show another account's unsent draft.
      drafts.clear(); body.value=''; updateCounter(); author=user?.id || null;
    }
    form.hidden=!user || !activeTrack;
    $('commentGuest').hidden=!!user && !!activeTrack;
    $('postComment').disabled=sending || !ready;
    const caption=$('commentGuest').querySelector('p');
    const button=$('commentLogin');
    if (!activeTrack && user) {
      caption.textContent='选择一首作品，加入它的讨论。';
      button.replaceChildren(document.createTextNode('选择讨论曲目'),icon('arrow'));
    } else {
      caption.textContent='每个听者，都有自己的发现。';
      button.replaceChildren(document.createTextNode('登录 / 注册后发表评论'),icon('arrow'));
    }
    renderRows();
  }
  function renderRows() {
    list.replaceChildren();
    for (const row of rows) {
      const article=document.createElement('article'); article.className='comment-item';
      const header=document.createElement('div'); header.className='comment-author-row';
      const avatar=document.createElement('span'); avatar.className='comment-avatar'; avatar.setAttribute('aria-hidden','true'); avatar.textContent=Array.from(row.author_name || '听')[0];
      const name=document.createElement('span'); name.className='comment-author'; name.textContent=row.author_name || '听者';
      const date=document.createElement('time'); date.className='comment-date'; date.dateTime=row.created_at;
      const timestamp=new Date(row.created_at); date.textContent=Number.isNaN(timestamp.getTime()) ? '' : timestamp.toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
      header.append(avatar,name,date);
      const text=document.createElement('p'); text.className='comment-body'; text.textContent=row.body;
      article.append(header,text);
      if (!activeTrack) {
        const track=document.createElement('button'); track.type='button'; track.className='text-button comment-track'; track.textContent=`${row.track_id}. ${tracks.get(row.track_id) || '作品讨论'} ↗`;
        track.addEventListener('click',()=>changeTrack(row.track_id)); article.append(track);
      }
      if (getUser()?.id===row.user_id) {
        const remove=document.createElement('button'); remove.type='button'; remove.className='text-button delete-comment'; remove.append(icon('trash',12),document.createTextNode(' 删除我的评论'));
        remove.addEventListener('click',async()=>{
          if (!confirm('删除这条评论？')) return;
          const currentGeneration=generation;
          remove.disabled=true;
          try {
            const token=await getToken(); if (!token) throw new Error('请重新登录后删除评论');
            const response=await apiFetch(`${ENDPOINT}?id=eq.${encodeURIComponent(row.id)}`,{method:'DELETE',headers:{...headers(token),Prefer:'return=representation'}});
            const deleted=await response.json();
            if (!Array.isArray(deleted) || deleted.length!==1) throw new Error('未能删除评论，请刷新后重试');
            if (generation!==currentGeneration) return;
            rows=rows.filter(item=>item.id!==row.id); renderRows();
            if (!rows.length) $('commentsStatus').textContent='还没有评论。分享你的第一个发现。';
            notify('评论已删除');
          } catch(error) { if (generation===currentGeneration) feedback(error.message,true); }
          finally { remove.disabled=false; }
        }); article.append(remove);
      }
      list.append(article);
    }
  }
  async function load(reset=true) {
    const request=++generation;
    if (reset) { rows=[]; cursor=null; ready=false; renderRows(); }
    $('commentsStatus').textContent='正在读取讨论…';
    $('retryComments').hidden=true;
    $('moreComments').hidden=true;
    updateAuth();
    try {
      const params=new URLSearchParams({select:'id,track_id,user_id,author_name,body,created_at',order:'created_at.desc,id.desc',limit:String(PAGE_SIZE+1)});
      if (activeTrack) params.set('track_id',`eq.${activeTrack}`);
      if (cursor && !reset) params.set('or',`(created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id}))`);
      const response=await apiFetch(`${ENDPOINT}?${params}`,{headers:headers()});
      const received=await response.json();
      if (!Array.isArray(received)) throw new Error('评论读取失败，请重试');
      if (request!==generation || !dialog.open) return;
      const page=received.slice(0,PAGE_SIZE);
      const seen=new Set(rows.map(row=>row.id));
      rows.push(...page.filter(row=>!seen.has(row.id)));
      cursor=page.at(-1) || cursor;
      ready=true;
      $('commentsStatus').textContent=rows.length ? '' : '还没有评论。分享你的第一个发现。';
      $('moreComments').hidden=received.length<=PAGE_SIZE;
      updateAuth();
    } catch(error) {
      if (request!==generation || !dialog.open) return;
      ready=false;
      $('commentsStatus').textContent=error.status===404 ? '评论服务尚未启用，请稍后再来。' : '暂时无法读取评论，请检查网络后重试。';
      $('retryComments').hidden=false; updateAuth();
    }
  }
  function changeTrack(id) {
    if (sending) return;
    saveDraft(); activeTrack=id;
    select.value=id || '';
    $('commentsTitle').textContent=id ? '曲目讨论' : '听辨讨论';
    $('commentsDescription').textContent=id ? `${String(id).padStart(2,'0')} / ${tracks.get(id)}` : '从中世纪到二十世纪，交流作品、听辨特征与录音版本。';
    body.value=drafts.get(id) || ''; updateCounter(); feedback(); updateAuth(); load();
  }
  function open(id=null) {
    if (id!==null && !tracks.has(id)) return;
    if (sending) {notify('评论正在发布，请稍候。');return;}
    $('commentsFilter').hidden=id!==null;
    if (!dialog.open) dialog.showModal();
    changeTrack(id);
  }
  dialog.addEventListener('close',()=>{saveDraft();generation++;});
  $('closeComments').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if (e.target===dialog && (e.clientX<dialog.getBoundingClientRect().left || e.clientX>dialog.getBoundingClientRect().right || e.clientY<dialog.getBoundingClientRect().top || e.clientY>dialog.getBoundingClientRect().bottom)) dialog.close();});
  $('commentLogin').addEventListener('click',()=>{if (!activeTrack && getUser()) select.focus(); else openAuth();});
  $('retryComments').addEventListener('click',()=>load());
  $('moreComments').addEventListener('click',()=>load(false));
  select.addEventListener('change',()=>changeTrack(select.value ? Number(select.value) : null));
  body.addEventListener('input',()=>{updateCounter();saveDraft();feedback();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if (sending || !activeTrack || !ready) return;
    const text=body.value.trim();
    if (!text || text.length>2000) {feedback('请输入 1–2000 字的评论。',true);body.focus();return;}
    const track=activeTrack;
    const userId=getUser()?.id;
    const request=generation;
    sending=true; body.readOnly=true; select.disabled=true; updateAuth(); feedback('正在发布…');
    try {
      const token=await getToken();
      if (!token || !userId || getUser()?.id!==userId) throw new Error('请重新登录后发表评论');
      const response=await apiFetch(ENDPOINT,{method:'POST',headers:{...headers(token),'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({track_id:track,body:text})});
      const posted=await response.json();
      if (!Array.isArray(posted) || !posted[0]?.id) throw new Error('未能确认发布结果，请刷新评论后核对');
      drafts.delete(track);
      if (activeTrack===track && getUser()?.id===userId) {body.value='';updateCounter();}
      if (request!==generation || !dialog.open) {notify('评论已发布');return;}
      feedback('评论已发布。');
      await load();
    } catch(error) { if (request===generation && dialog.open) feedback(error.message || '发布失败，内容已保留，请稍后重试。',true); }
    finally {sending=false;body.readOnly=false;select.disabled=false;updateAuth();}
  });
  return {open,updateAuth};
}
