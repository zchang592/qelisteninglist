import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
import { icon } from './icons.js';
import { avatarForUser, noteAvatar } from './avatars.js';

const ENDPOINT = `${SUPABASE_URL}/rest/v1/listening_comments`;
const COUNTS_ENDPOINT = `${SUPABASE_URL}/rest/v1/rpc/qe_comment_reply_counts`;
const $ = id => document.getElementById(id);
const PAGE_SIZE = 20;
const FIELDS = 'id,track_id,user_id,author_name,body,created_at';
const THREAD_FIELDS = `${FIELDS},parent_id,reply_to_id,avatar_key`;

export function createCommentsController({data, getUser, getToken, openAuth, apiFetch, notify}) {
  const tracks = new Map(data.flatMap(([,composers])=>composers.flatMap(([,tracks])=>tracks)));
  const dialog = $('commentsDialog');
  const select = $('commentTrack');
  const body = $('commentBody');
  const form = $('commentForm');
  const list = $('commentsList');
  const drafts = new Map();
  const replyDrafts = new Map();
  let activeTrack = null;
  let generation = 0;
  let cursor = null;
  let sending = false;
  let ready = false;
  let backendMode = null;
  let rows = [];
  let threads = new Map();
  let author = getUser()?.id || null;
  let guestReplyIntent = null;

  const all = document.createElement('option');
  all.value=''; all.textContent='全部曲目 · 选择作品后可发表评论'; select.append(all);
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
  function threadFor(id) {
    if(!threads.has(id)) threads.set(id,{open:false,loaded:false,loading:false,rows:[],cursor:null,more:false,count:null,target:null,error:''});
    return threads.get(id);
  }
  function authorAvatar(row) {
    const key=avatarForUser({id:row.user_id,user_metadata:{avatar_key:row.avatar_key}});
    return noteAvatar(key,'comment-avatar');
  }
  function updateAuth() {
    const user=getUser();
    if ((user?.id || null)!==author) {
      // Do not carry one listener's unsent text into another listener's account.
      drafts.clear(); replyDrafts.clear(); body.value=''; updateCounter();
      for(const thread of threads.values()) thread.target=null;
      if(!author && user && guestReplyIntent && threads.has(guestReplyIntent.root)) {
        threads.get(guestReplyIntent.root).target=guestReplyIntent.target;
      }
      guestReplyIntent=null; author=user?.id || null;
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
  function addButton(label, className, onClick, symbol=null) {
    const button=document.createElement('button'); button.type='button'; button.className=className;
    if(symbol) button.append(icon(symbol,13));
    button.append(document.createTextNode(label));button.addEventListener('click',onClick);return button;
  }
  function commentContent(row, root, thread, isReply=false) {
    const article=document.createElement('article');
    article.className=isReply?'comment-item comment-reply':'comment-item';
    article.dataset.commentId=row.id;
    const header=document.createElement('div'); header.className='comment-author-row';
    const avatar=authorAvatar(row);
    const name=document.createElement('span'); name.className='comment-author'; name.textContent=row.author_name || '听者';
    const date=document.createElement('time'); date.className='comment-date'; date.dateTime=row.created_at;
    const timestamp=new Date(row.created_at);
    date.textContent=Number.isNaN(timestamp.getTime()) ? '' : timestamp.toLocaleString('zh-CN',{year:timestamp.getFullYear()===new Date().getFullYear()?undefined:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    header.append(avatar,name,date);article.append(header);
    const text=document.createElement('p'); text.className='comment-body';
    if(isReply && row.reply_to_id && row.reply_to_id!==root.id) {
      const target=thread.rows.find(item=>item.id===row.reply_to_id);
      if(target) {const mention=document.createElement('span');mention.className='reply-mention';mention.textContent=`回复 @${target.author_name || '听者'} `;text.append(mention);}
    }
    text.append(document.createTextNode(row.body));article.append(text);
    if (!activeTrack && !isReply) {
      const track=addButton(`${row.track_id}. ${tracks.get(row.track_id) || '作品讨论'} ↗`,'text-button comment-track',()=>changeTrack(row.track_id));
      article.append(track);
    }
    const actions=document.createElement('div');actions.className='comment-actions';
    if(backendMode==='threads') {
      const reply=addButton('回复','comment-action reply-action',()=>startReply(root,row), 'comment');
      reply.disabled=sending;reply.setAttribute('aria-label',`回复 ${row.author_name || '听者'} 的评论`);actions.append(reply);
    }
    if(getUser()?.id===row.user_id) {
      const remove=addButton('删除','comment-action delete-comment',()=>deleteComment(row,root,isReply), 'trash');
      remove.disabled=sending;remove.setAttribute('aria-label','删除我的评论');actions.append(remove);
    }
    if(actions.childElementCount) article.append(actions);
    return article;
  }
  function renderRows(focusRoot=null) {
    const focused=document.activeElement;
    const focusedRoot=focused?.matches?.('.reply-form textarea') ? focused.closest('.reply-form')?.dataset.replyForm : null;
    const selection=focusedRoot ? [focused.selectionStart,focused.selectionEnd] : null;
    list.replaceChildren();
    for (const root of rows) {
      const thread=threadFor(root.id);
      const article=commentContent(root,root,thread);
      if(backendMode==='threads') {
        const container=document.createElement('div');container.className='comment-thread';
        if((thread.count===null || thread.count>0 || thread.loaded) && !thread.open) {
          const label=thread.count===null?'查看回复':thread.count?`查看 ${thread.count} 条回复`:'查看回复';
          const show=addButton(label,'thread-toggle',()=>{thread.open=true;renderRows();if(!thread.loaded)loadReplies(root);});
          show.setAttribute('aria-label',`${label}，${root.author_name || '听者'} 的评论`);container.append(show);
        }
        if(thread.open) {
          const replyList=document.createElement('div');replyList.className='reply-list';
          if(thread.loading && !thread.rows.length) {const loading=document.createElement('p');loading.className='thread-message';loading.textContent='正在读取回复…';replyList.append(loading);}
          for(const reply of thread.rows) replyList.append(commentContent(reply,root,thread,true));
          if(thread.error) {
            const message=document.createElement('p');message.className='thread-error';message.textContent=thread.error;replyList.append(message);
            if(!thread.target) replyList.append(addButton('重新加载回复','thread-toggle',()=>loadReplies(root, !thread.loaded)));
          } else if(thread.loaded && !thread.rows.length) {
            const empty=document.createElement('p');empty.className='thread-message';empty.textContent='还没有回复。';replyList.append(empty);
          }
          if(thread.more) {
            const more=addButton(thread.loading?'正在加载…':'加载更多回复','thread-toggle',()=>loadReplies(root,false));
            more.disabled=thread.loading;replyList.append(more);
          }
          if(thread.target && getUser()) replyList.append(replyComposer(root,thread));
          const close=addButton('收起回复','thread-toggle thread-collapse',()=>{thread.open=false;thread.target=null;renderRows();});
          replyList.append(close);container.append(replyList);
        }
        article.append(container);
      }
      list.append(article);
    }
    const restoreRoot=focusRoot || focusedRoot;
    if(restoreRoot) {
      const input=list.querySelector(`[data-reply-form="${CSS.escape(restoreRoot)}"] textarea`);
      if(input) {input.focus();if(selection && !focusRoot)input.setSelectionRange(...selection);}
    }
  }
  function replyComposer(root,thread) {
    const target=thread.target===root.id?root:thread.rows.find(item=>item.id===thread.target);
    const replyForm=document.createElement('form');replyForm.className='reply-form';replyForm.dataset.replyForm=root.id;
    const label=document.createElement('label');label.textContent=`回复 ${target?.author_name || '这位听者'}`;
    const input=document.createElement('textarea');input.id=`reply-${root.id}`;label.htmlFor=input.id;input.rows=2;input.maxLength=2000;input.required=true;
    input.placeholder='写下你的回复…';input.setAttribute('aria-label',`回复 ${target?.author_name || '这位听者'}`);
    input.value=replyDrafts.get(root.id) || '';
    input.addEventListener('input',()=>{replyDrafts.set(root.id,input.value);thread.error='';});
    const actions=document.createElement('div');actions.className='reply-form-actions';
    const cancel=addButton('取消','comment-action',()=>{thread.target=null;renderRows();});
    const submit=document.createElement('button');submit.type='submit';submit.className='primary-btn reply-submit';submit.textContent='发布回复';submit.disabled=sending;
    actions.append(cancel,submit);replyForm.append(label,input,actions);
    replyForm.addEventListener('submit',event=>{event.preventDefault();postReply(root,thread,input.value);});
    return replyForm;
  }
  function startReply(root,target) {
    const thread=threadFor(root.id);thread.open=true;thread.target=target.id;thread.error='';
    if(!getUser()) {guestReplyIntent={root:root.id,target:target.id};renderRows();openAuth();}
    else renderRows(root.id);
    if(!thread.loaded && !thread.loading) loadReplies(root);
  }
  async function countReplies(request, page) {
    if(!page.length || backendMode!=='threads') return;
    try {
      const response=await apiFetch(COUNTS_ENDPOINT,{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({root_ids:page.map(row=>row.id)})});
      const counts=await response.json();
      if(request!==generation || !dialog.open || !Array.isArray(counts)) return;
      const map=new Map(counts.map(item=>[item.root_id,Number(item.reply_count)]));
      for(const row of page) threadFor(row.id).count=map.get(row.id) || 0;
      renderRows();
    } catch { /* Replies remain discoverable even if counts are temporarily unavailable. */ }
  }
  async function loadReplies(root, reset=true) {
    const thread=threadFor(root.id);
    if(thread.loading || backendMode!=='threads') return;
    const request=generation;
    thread.loading=true;thread.error='';
    if(reset){thread.rows=[];thread.cursor=null;thread.more=false;thread.loaded=false;}
    renderRows();
    try {
      const params=new URLSearchParams({select:THREAD_FIELDS,parent_id:`eq.${root.id}`,order:'created_at.asc,id.asc',limit:String(PAGE_SIZE+1)});
      if(thread.cursor && !reset) params.set('or',`(created_at.gt.${thread.cursor.created_at},and(created_at.eq.${thread.cursor.created_at},id.gt.${thread.cursor.id}))`);
      const response=await apiFetch(`${ENDPOINT}?${params}`,{headers:headers()});
      const received=await response.json();
      if(!Array.isArray(received)) throw new Error('回复读取失败');
      if(request!==generation || !dialog.open || threadFor(root.id)!==thread) return;
      const page=received.slice(0,PAGE_SIZE);
      const seen=new Set(thread.rows.map(item=>item.id));thread.rows.push(...page.filter(item=>!seen.has(item.id)));
      thread.rows.sort((a,b)=>a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
      thread.cursor=page.at(-1) || thread.cursor;thread.more=received.length>PAGE_SIZE;thread.loaded=true;
    } catch(error) {
      if(request===generation && dialog.open) thread.error='无法加载回复，请重试。';
    } finally {
      thread.loading=false;
      if(request===generation && dialog.open) renderRows();
    }
  }
  async function deleteComment(row,root,isReply) {
    const message=isReply?'删除这条回复？':'删除这条评论？这条讨论下的回复会保留，并成为独立评论。';
    if(!confirm(message)) return;
    const request=generation;
    try {
      const token=await getToken();if(!token) throw new Error('请重新登录后删除评论');
      const response=await apiFetch(`${ENDPOINT}?id=eq.${encodeURIComponent(row.id)}`,{method:'DELETE',headers:{...headers(token),Prefer:'return=representation'}});
      const deleted=await response.json();
      if(!Array.isArray(deleted) || deleted.length!==1) throw new Error('未能删除评论，请刷新后重试');
      if(request!==generation || !dialog.open) return;
      if(isReply) {
        const thread=threadFor(root.id);thread.rows=thread.rows.filter(item=>item.id!==row.id);
        if(thread.count!==null) thread.count=Math.max(0,thread.count-1);
        if(thread.target===row.id) thread.target=root.id;
        renderRows();
      } else {threads.delete(root.id);await load(true);}
      notify('评论已删除');
    } catch(error) {if(request===generation && dialog.open) feedback(error.message,true);}
  }
  async function rootsRequest(withThreads, reset) {
    const params=new URLSearchParams({select:withThreads?THREAD_FIELDS:FIELDS,order:'created_at.desc,id.desc',limit:String(PAGE_SIZE+1)});
    if(activeTrack) params.set('track_id',`eq.${activeTrack}`);
    if(withThreads) params.set('parent_id','is.null');
    if(cursor && !reset) params.set('or',`(created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id}))`);
    const response=await apiFetch(`${ENDPOINT}?${params}`,{headers:headers()});
    return response.json();
  }
  async function load(reset=true) {
    const request=++generation;
    if(reset) {rows=[];cursor=null;ready=false;renderRows();}
    $('commentsStatus').textContent='正在读取讨论…';$('retryComments').hidden=true;$('moreComments').hidden=true;updateAuth();
    try {
      let received;
      try {
        received=await rootsRequest(backendMode!=='legacy',reset);
        if(backendMode===null) backendMode='threads';
      } catch(error) {
        if(backendMode===null && (error.status===400 || error.code==='42703' || error.code==='PGRST204')) {
          // A site can deploy before its database migration; existing discussion remains readable.
          received=await rootsRequest(false,reset);backendMode='legacy';
        } else throw error;
      }
      if(!Array.isArray(received)) throw new Error('评论读取失败，请重试');
      if(request!==generation || !dialog.open) return;
      const page=received.slice(0,PAGE_SIZE);
      const seen=new Set(rows.map(row=>row.id));rows.push(...page.filter(row=>!seen.has(row.id)));
      cursor=page.at(-1) || cursor;ready=true;
      $('commentsStatus').textContent=rows.length?'':'还没有评论。分享你的第一个发现。';
      $('moreComments').hidden=received.length<=PAGE_SIZE;
      $('threadStatus').hidden=backendMode!=='legacy';
      updateAuth();
      if(backendMode==='threads') countReplies(request,page);
    } catch(error) {
      if(request!==generation || !dialog.open) return;
      ready=false;
      $('commentsStatus').textContent=error.status===404?'评论服务尚未启用，请稍后再来。':'暂时无法读取评论，请检查网络后重试。';
      $('retryComments').hidden=false;updateAuth();
    }
  }
  function changeTrack(id) {
    if(sending) return;
    saveDraft();
    if(activeTrack!==id) {threads=new Map();guestReplyIntent=null;}
    activeTrack=id;select.value=id || '';
    $('commentsTitle').textContent=id?'曲目讨论':'听辨讨论';
    $('commentsDescription').textContent=id?`${String(id).padStart(2,'0')} / ${tracks.get(id)}`:'从中世纪到二十世纪，交流作品、听辨特征与录音版本。';
    body.value=drafts.get(id) || '';updateCounter();feedback();updateAuth();load();
  }
  function open(id=null) {
    if(id!==null && !tracks.has(id)) return;
    if(sending) {notify('评论正在发布，请稍候。');return;}
    if(!dialog.open && backendMode==='legacy') backendMode=null;
    $('commentsFilter').hidden=id!==null;
    if(!dialog.open) dialog.showModal();
    changeTrack(id);
  }
  async function postReply(root,thread,value) {
    const text=value.trim();
    if(sending || !text || text.length>2000) {thread.error='请输入 1–2000 字的回复。';renderRows();return;}
    const userId=getUser()?.id;
    const request=generation;
    const target=thread.target;
    sending=true;thread.error='';updateAuth();
    try {
      const token=await getToken();
      if(!token || !userId || getUser()?.id!==userId) throw new Error('请重新登录后发表评论');
      const response=await apiFetch(ENDPOINT,{method:'POST',headers:{...headers(token),'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({track_id:root.track_id,body:text,parent_id:root.id,reply_to_id:target})});
      const result=await response.json();
      if(!Array.isArray(result) || !result[0]?.id) throw new Error('未能确认发布结果，请刷新评论后核对');
      replyDrafts.delete(root.id);
      if(request!==generation || !dialog.open) {notify('回复已发布');return;}
      const posted=result[0];
      if(!thread.rows.some(row=>row.id===posted.id)) thread.rows.push(posted);
      thread.rows.sort((a,b)=>a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
      thread.count=thread.count===null?null:thread.count+1;thread.target=null;thread.open=true;
      notify('回复已发布');
    } catch(error) {
      if(request===generation && dialog.open) thread.error=error.message || '发布失败，回复已保留，请稍后重试。';
    } finally {sending=false;updateAuth();}
  }
  dialog.addEventListener('close',()=>{saveDraft();generation++;});
  $('closeComments').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog && (e.clientX<dialog.getBoundingClientRect().left || e.clientX>dialog.getBoundingClientRect().right || e.clientY<dialog.getBoundingClientRect().top || e.clientY>dialog.getBoundingClientRect().bottom)) dialog.close();});
  $('commentLogin').addEventListener('click',()=>{if(!activeTrack && getUser())select.focus();else openAuth();});
  $('retryComments').addEventListener('click',()=>{backendMode=null;load();});
  $('moreComments').addEventListener('click',()=>load(false));
  select.addEventListener('change',()=>changeTrack(select.value?Number(select.value):null));
  body.addEventListener('input',()=>{updateCounter();saveDraft();feedback();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(sending || !activeTrack || !ready) return;
    const text=body.value.trim();
    if(!text || text.length>2000){feedback('请输入 1–2000 字的评论。',true);body.focus();return;}
    const track=activeTrack;const userId=getUser()?.id;const request=generation;
    sending=true;body.readOnly=true;select.disabled=true;updateAuth();feedback('正在发布…');
    try {
      const token=await getToken();
      if(!token || !userId || getUser()?.id!==userId) throw new Error('请重新登录后发表评论');
      const response=await apiFetch(ENDPOINT,{method:'POST',headers:{...headers(token),'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({track_id:track,body:text})});
      const posted=await response.json();
      if(!Array.isArray(posted) || !posted[0]?.id) throw new Error('未能确认发布结果，请刷新评论后核对');
      drafts.delete(track);
      if(activeTrack===track && getUser()?.id===userId){body.value='';updateCounter();}
      if(request!==generation || !dialog.open){notify('评论已发布');return;}
      feedback('评论已发布。');await load();
    } catch(error) {if(request===generation && dialog.open)feedback(error.message || '发布失败，内容已保留，请稍后重试。',true);}
    finally {sending=false;body.readOnly=false;select.disabled=false;updateAuth();}
  });
  function updateProfile(user) {
    if(!user) return;
    const apply=row=>{if(row.user_id===user.id){row.author_name=user.user_metadata?.display_name?.trim() || row.author_name;row.avatar_key=avatarForUser(user);}};
    rows.forEach(apply);for(const thread of threads.values())thread.rows.forEach(apply);
    renderRows();
  }
  return {open,updateAuth,updateProfile};
}
