import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const ENDPOINT=`${SUPABASE_URL}/rest/v1/listening_favorites`;

export function createFavoritesController({getUser,getToken,openAuth,apiFetch,notify}) {
  let userId=null;
  let generation=0;
  let ids=new Set();
  let loading=false;
  let ready=false;
  let error='';
  let loadPromise=null;
  let pendingIntent=null;
  const pending=new Set();
  const listeners=new Set();

  function emit(){for(const listener of listeners) listener();}
  function headers(token) {return {apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,Accept:'application/json'};}
  function snapshot(){return {signedIn:!!userId,loading,ready,error,count:ids.size};}
  function userChanged() {
    const next=getUser()?.id || null;
    if(next===userId)return;
    if(userId)pendingIntent=null;
    userId=next;generation++;ids=new Set();ready=false;error='';loading=false;loadPromise=null;pending.clear();emit();
    if(next)load();
  }
  async function load() {
    if(!userId)return false;
    if(loadPromise)return loadPromise;
    const current=generation;
    const owner=userId;
    loading=true;error='';emit();
    const promise=(async()=>{
      try {
        const token=await getToken();
        if(!token || current!==generation || owner!==getUser()?.id)throw new Error('请重新登录后查看收藏');
        const params=new URLSearchParams({select:'track_id',user_id:`eq.${owner}`,order:'track_id.asc'});
        const response=await apiFetch(`${ENDPOINT}?${params}`,{headers:headers(token)});
        const rows=await response.json();
        if(!Array.isArray(rows))throw new Error('收藏数据暂时无法读取');
        if(current!==generation)return false;
        ids=new Set(rows.map(row=>Number(row.track_id)).filter(id=>Number.isInteger(id)&&id>=1&&id<=160));
        ready=true;error='';
        return true;
      } catch(err) {
        if(current===generation){ready=false;error='暂时无法读取收藏，请稍后重试。';}
        return false;
      } finally {
        if(current===generation){loading=false;emit();}
      }
    })();
    loadPromise=promise;
    const ok=await promise;
    if(loadPromise===promise)loadPromise=null;
    if(ok && current===generation && pendingIntent!==null){
      const id=pendingIntent;pendingIntent=null;
      if(!ids.has(id))await toggle(id);
    }
    return ok;
  }
  async function toggle(id) {
    if(!Number.isInteger(id)||id<1||id>160)return;
    if(!userId){pendingIntent=id;openAuth();return;}
    if(pending.has(id))return;
    if(!ready && !await load()){notify('收藏暂时不可用，请稍后重试');return;}
    const current=generation;
    const owner=userId;
    const adding=!ids.has(id);
    pending.add(id);emit();
    try {
      const token=await getToken();
      if(!token || current!==generation || owner!==getUser()?.id)throw new Error('请重新登录');
      if(adding){
        await apiFetch(`${ENDPOINT}?on_conflict=user_id,track_id`,{method:'POST',headers:{...headers(token),'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({track_id:id})});
      } else {
        const params=new URLSearchParams({user_id:`eq.${owner}`,track_id:`eq.${id}`});
        await apiFetch(`${ENDPOINT}?${params}`,{method:'DELETE',headers:{...headers(token),Prefer:'return=minimal'}});
      }
      if(current!==generation)return;
      if(adding)ids.add(id);else ids.delete(id);
      notify(adding?'已加入收藏':'已取消收藏');
    } catch(err){
      if(current===generation)notify('收藏保存失败，请检查网络后重试');
    } finally {
      if(current===generation){pending.delete(id);emit();}
    }
  }
  return {userChanged,load,toggle,has:id=>ids.has(id),pending:id=>pending.has(id),snapshot,subscribe:fn=>listeners.add(fn)};
}
