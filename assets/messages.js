import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

// Inbox state is local to this browser. Removing a notice never removes the public comment.
export function createMessagesController({isAdmin,getUser,getToken,apiFetch}) {
  const dialog=document.getElementById('messagesDialog');
  const list=document.getElementById('messagesList');
  const status=document.getElementById('messagesStatus');
  const badge=document.getElementById('messagesBadge');
  let rows=[],tab='inbox',generation=0,busy=false,markSeenAfterLoad=false;
  const stateKey=()=>`qe-message-inbox-v1-${getUser()?.id || ''}`;
  function read(){try{return JSON.parse(localStorage.getItem(stateKey())||'{}');}catch{return {};}}
  function write(state){try{localStorage.setItem(stateKey(),JSON.stringify(state));return true;}catch{status.textContent='无法保存消息状态，请检查浏览器存储设置。';return false;}}
  function updateBadge(){const state=read(),trash=new Set(state.trash||[]);const n=rows.filter(r=>!trash.has(r.id)&&r.created_at>(state.seen||'')).length;for(const el of [badge,document.getElementById('messagesTopBadge')]){el.hidden=!n;el.textContent=n>99?'99+':String(n);}}
  function render(){
    const state=read(),trash=new Set(state.trash||[]);list.replaceChildren();
    const visible=rows.filter(r=>trash.has(r.id)===(tab==='trash'));
    document.getElementById('messagesInboxTab').setAttribute('aria-pressed',String(tab==='inbox'));
    document.getElementById('messagesTrashTab').setAttribute('aria-pressed',String(tab==='trash'));
    document.getElementById('messagesAction').textContent=tab==='trash'?'恢复选中消息':'删除选中消息';
    document.getElementById('messagesSelectAll').checked=false;
    status.textContent=visible.length?'':'这里还没有消息。';
    for(const row of visible){
      const item=document.createElement('label');item.className='message-item';
      const check=document.createElement('input');check.type='checkbox';check.value=row.id;check.setAttribute('aria-label',`选择 ${row.author_name || '听者'} 的评论`);
      const content=document.createElement('span');content.className='message-content';
      const meta=document.createElement('span');meta.className='message-meta';
      const name=document.createElement('strong');name.textContent=row.author_name||'听者';
      const time=document.createElement('time');time.dateTime=row.created_at;time.textContent=new Date(row.created_at).toLocaleString('zh-CN');
      meta.append(name,time);const body=document.createElement('span');body.className='message-body';body.textContent=row.body;
      const track=document.createElement('span');track.className='message-track';track.textContent=`第 ${row.track_id} 首 · ${row.parent_id?'回复':'评论'}`;
      content.append(meta,body,track);item.append(check,content);list.append(item);
    }
  }
  async function refresh(markSeen=false){
    if(!isAdmin())return;
    if(markSeen)markSeenAfterLoad=true;
    if(busy)return;busy=true;const current=generation;
    try{
      const token=await getToken();if(!token||!isAdmin()||current!==generation)return;
      const all=[];for(let offset=0;;offset+=500){
        const params=new URLSearchParams({select:'id,track_id,author_name,body,created_at,parent_id',order:'created_at.desc,id.desc',limit:'500',offset:String(offset)});
        const response=await apiFetch(`${SUPABASE_URL}/rest/v1/listening_comments?${params}`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,Accept:'application/json'}});
        const page=await response.json();if(!Array.isArray(page))throw new Error('Invalid response');all.push(...page);if(page.length<500)break;
      }
      if(current!==generation||!isAdmin())return;rows=all;
      if(markSeenAfterLoad&&rows.length){const state=read();state.seen=rows[0].created_at;write(state);}
      markSeenAfterLoad=false;
      updateBadge();if(dialog.open)render();
    }catch{if(current===generation&&dialog.open)status.textContent='消息暂时无法加载，请稍后重试。';}
    finally{busy=false;}
  }
  function open(){if(!isAdmin())return;tab='inbox';render();dialog.showModal();refresh(true);}
  function reset(){generation++;rows=[];markSeenAfterLoad=false;badge.hidden=true;document.getElementById('messagesTopBadge').hidden=true;if(dialog.open)dialog.close();}
  document.getElementById('closeMessages').addEventListener('click',()=>dialog.close());
  document.getElementById('messagesInboxTab').addEventListener('click',()=>{tab='inbox';render();});
  document.getElementById('messagesTrashTab').addEventListener('click',()=>{tab='trash';render();});
  document.getElementById('messagesSelectAll').addEventListener('change',e=>list.querySelectorAll('input').forEach(c=>{c.checked=e.target.checked;}));
  document.getElementById('messagesAction').addEventListener('click',()=>{
    const selected=[...list.querySelectorAll('input:checked')].map(c=>c.value);if(!selected.length){status.textContent='请先选择消息。';return;}
    const state=read(),trash=new Set(state.trash||[]);selected.forEach(id=>tab==='trash'?trash.delete(id):trash.add(id));state.trash=[...trash];if(write(state)){render();updateBadge();}
  });
  setInterval(()=>{if(isAdmin()&&!document.hidden)refresh();},30000);
  return {open,refresh,reset};
}
