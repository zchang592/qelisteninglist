import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';

const INTRO={zh:'QE Listening List 是一个用于 QE 听辨练习的曲目资料库。浏览不需要账号。\n注册需要管理员提供的邀请码；登录后可以收藏作品、发表和回复评论。\n曲目根据提供的四份听辨清单整理，并不代表最终 QE 考试曲目库；请以官方通知为准。\nYouTube 链接由 AI 自动识别和寻找，仅供参考。不同录音可能有版本差异，尤其是中世纪和文艺复兴时期，请结合原始清单核对。\n如有任何问题，请联系 zchang592@gmail.com。',en:'QE Listening List is a listening library for QE preparation. You can browse without an account.\nRegistration requires an invitation code from the administrator. Sign in to save favorites and join the discussion.\nThe library was assembled from four supplied listening lists and is not the final QE examination repertoire. Please refer to official notices.\nYouTube links were identified and found using AI and are for reference only. Recordings may differ, especially for Medieval and Renaissance works; check them against the original list.\nFor questions, contact zchang592@gmail.com.'};
const translations={
 '网站介绍':'About','消息':'Messages','整理进度':'My progress','网站设置':'Site settings','账户设置':'Account settings','退出登录':'Sign out','登录 / 注册':'Sign in / Register','访客':'Guest','已登录':'Signed in','管理员':'Admin','曲目库':'Library','我的收藏':'Favorites','全部作品':'All works','听辨讨论':'Discussion','选择音符头像':'Choose an avatar','昵称':'Display name','保存':'Save','原清单指定的乐章 / 选曲':'Movements / selections specified in the source','原清单指定选段':'Selection specified in the source','待核对':'To be verified','乐章 / 选曲':'Movements / selections','整部作品 / 其他录音':'Complete works / other recordings','完整录音定位':'Position in complete recording','站内音频':'On-site audio','YouTube 录音版本':'YouTube recordings','其他平台搜索':'Search other platforms','在网易云搜索':'Search NetEase','B 站链接播放器（可选）':'Bilibili link player (optional)','收听版本':'Listening versions','搜索':'Search','打开搜索':'Open search','网易云音乐':'NetEase Cloud Music','讨论':'Discuss','复制标题':'Copy title','收藏':'Favorite','已收藏':'Favorited','查看方式':'Group by','按时期':'Period','按作曲家':'Composer','展开全部':'Show all','展开作曲家':'Expand composers','折叠作曲家':'Collapse composers','登录后可以收藏作品、参与曲目讨论。':'Sign in to save works and join the discussion.','进入曲目库':'Explore the library','不再显示这个提示':'Do not show this again','欢迎来到听辨室':'Welcome to the listening room','邮箱':'Email','密码':'Password','公开昵称':'Display name','邀请码':'Invitation code','设置密码':'Set password','登录账号':'Sign in','创建账号':'Create account','已有账号':'Already have an account','关闭':'Close','个人曲目':'Your collection','没有找到这首作品':'No works found','清除搜索':'Clear search','正在读取收藏':'Loading favorites','登录后收藏作品':'Sign in to save works','还没有收藏':'No favorites yet','重新加载':'Reload','浏览曲目':'Browse works','选择讨论曲目':'Choose a work','全部曲目 · 选择作品后可发表评论':'All works · choose a work to comment','发布评论':'Post comment','回复':'Reply','删除':'Delete','收起':'Collapse','播放':'Play','打开 ↗':'Open ↗','录音版本':'Recording','聆听、收藏，并和其他听者交流。':'Listen, save your favorites, and share discoveries with other listeners.','160 首作品，六个时期。聆听、收藏，并和其他听者交流。':'160 works across six periods. Listen, save favorites, and share discoveries.','展开收听版本，查看 YouTube 录音及版本说明，也可搜索网易云。':'Open listening versions to explore YouTube recordings and search NetEase.','共享曲目 · 公开讨论':'Shared repertoire · public discussion','中世纪至巴洛克录音已收录':'Medieval to Baroque recordings available','你的听辨账号':'Your listening account','邀请码需要向管理员获取。':'Ask the administrator for an invitation code.'
};
Object.assign(translations,{
 '在 B 站搜索':'Search Bilibili','粘贴 B 站视频链接或 BV 号，试听对应版本':'Paste a Bilibili video link or BV ID to preview a recording','载入播放器':'Load player','在 B 站打开 ↗':'Open on Bilibili ↗','请输入完整的 B 站视频链接或 BV 号。':'Enter a complete Bilibili video link or BV ID.',
 '曲目录音持续更新':'Recordings are being added','录音链接待补充，可先使用上方搜索。':'Recordings will be added; use the search link above in the meantime.',
 '注册一个账号，和其他听者交流作品与录音版本。':'Create an account to discuss works and recordings.',
 '你的听辨账号':'Your listening account','你的听辨账号':'Your listening account','昵称和评论会公开显示，邮箱不会显示在评论区。':'Your display name and comments are public; your email is private.',
 '交流录音版本，分享你听到的细节。':'Discuss recordings and share what you hear.',
 '试听试点':'Listening','听辨讨论':'Discussion','网站设置':'Site settings','网站介绍':'About','网站介绍':'About',
 '这里汇集大家的评论和回复。删除消息只会移入本机回收站，不会删除公开评论；可随时恢复。':'Review comments and replies. Deleting a message moves it to this browser’s trash and does not delete the public comment.',
 '评论消息':'Comment messages','回收站':'Trash','全选':'Select all','删除选中消息':'Delete selected','恢复选中消息':'Restore selected','这里还没有消息。':'No messages yet.',
 '请先选择消息。':'Select messages first.','网站设置':'Site settings','中文':'Chinese',
 '每行一段；保存后所有访客都会看到。请同时维护中英文版本。':'One paragraph per line. Changes are visible to all visitors. Please maintain both languages.',
 '每个邀请码限一个新用户注册使用；请通过私密渠道发送。':'Each code can be used once. Send it privately to the new listener.',
 '生成 10 个邀请码':'Generate 10 invitation codes','保存介绍':'Save introduction','可使用':'Available','已使用':'Used',
 '勾选每首作品，继续整理你的听辨进度。':'Mark each work to keep track of your listening progress.',
 '全部展开':'Expand all','全部折叠':'Collapse all','立即同步':'Sync now','导出进度':'Export progress','导入进度':'Import progress',
 '没有找到这首收藏':'No matching favorites','试试其他作曲家姓名或作品名称。':'Try another composer or work title.',
 '收藏会保存在你的账号中，换设备也能找到。':'Favorites are saved to your account and available on other devices.',
 '在曲目旁点击爱心，就能把作品收进这里。':'Click the heart next to a work to save it here.',
 '试试作曲家姓名、作品名或曲目编号。':'Try a composer, work title, or number.',
 '每个听者，都有自己的发现。':'Every listener has something to discover.',
 '登录 / 注册后发表评论':'Sign in or register to comment',
 '选择一首作品，加入它的讨论。':'Choose a work to join its discussion.',
 '加载更早的评论':'Load older comments','重新加载评论':'Reload comments',
 '分享你的听辨发现':'Share your listening notes','回复功能暂不可用，现有评论仍可查看和发布。':'Replies are temporarily unavailable. You can still read and post comments.',
 '网站介绍':'About this site','不再显示这个提示':'Do not show this again','进入曲目库':'Explore the library',
 '管理员激活':'Administrator activation','仅维护共享目录的管理员需要专用激活码，发表评论无需激活。':'Only administrators need an activation code. You do not need one to comment.',
 '一次性激活码':'One-time activation code','激活管理员权限':'Activate administrator access','退出账号':'Sign out',
 '请填写管理员提供的邀请码。':'Enter the invitation code provided by the administrator.',
 '中世纪':'Medieval','文艺复兴':'Renaissance','巴洛克':'Baroque','古典主义':'Classical','浪漫主义':'Romantic','二十世纪':'20th Century'
});
Object.assign(translations,{
 '原清单仅注明六声部合唱，具体段落未明确；此处提供整部 BWV 243，供核对。':'The source specifies a six-part chorus without a movement; the complete BWV 243 is included for reference.',
 '原清单未指定曲集册数或曲目；这里提供具体选曲供参考。':'The source does not specify a book or piece; these selections are for reference.',
 '请留意不同乐器编配。':'Instrumentation varies between versions.',
 '请留意完整协奏曲与单乐章版本的区别。':'Check whether this is the complete concerto or a single movement.',
 '资料列为六声部同名作品；请留意与同名弥撒或五声部经文歌的区别。':'The source specifies the six-part work. Distinguish it from the mass and five-part motet of the same name.',
 '赋格的乐器编配并非唯一，请留意视频中的编制。':'Instrumentation varies between performances of this fugue.',
 '部分版本的曲目编号不同，请以曲名辨认。':'Movement numbering can vary; identify this selection by its title.',
 '部分视频为完整协奏曲，第一乐章在开头。':'Some videos contain the complete concerto; the first movement is at the beginning.',
 '部分视频为完整组曲，序曲在开头。':'Some videos contain the complete suite; the overture is at the beginning.',
 'Huelgas Ensemble 演唱，附动态乐谱。':'Performed by Huelgas Ensemble with an animated score.',
 'Kyrie 分段呈现素歌与复调交替。':'The Kyrie alternates chant and polyphony.',
 '依 Harley 978 手稿六声部演唱，复原后与常见改编略异。':'A six-part reconstruction from manuscript Harley 978; it differs from common editions.',
 '唱片发行版；曲名明确标为 Missa de Angelis – Kyrie。':'Released recording explicitly titled Missa de Angelis – Kyrie.',
 '完整套曲中的 Sequentia；Dies irae 从 08:58 开始。':'Complete mass; the Dies irae sequence begins at 08:58.',
 '完整套曲；Requiem aeternam 在 00:19，后续 Graduale 在 03:49。':'Complete mass; the Requiem aeternam begins at 00:19 and the Graduale at 03:49.',
 '描述注明 Hilliard Ensemble 演唱。':'The uploader credits the Hilliard Ensemble.',
 '独立 Introitus；发布者标注 pipeorgan；伴奏及演绎方式待试听核对。':'Standalone Introitus; the uploader mentions pipe organ. Accompaniment needs listening verification.',
 '独立 Kyrie 演绎。':'Standalone Kyrie performance.', '独立 Kyrie 片段。':'Standalone Kyrie.',
 '独立圣咏版本。':'Standalone chant.', '独立圣咏，附歌词与译文。':'Standalone chant with lyrics and translation.',
 '现代谱与方形音符对照练习，适合听唱法差异。':'Practice recording with modern and square notation side by side.',
 '视频为整部弥撒；Kyrie 从 00:00 开始，说明提示前两段比谱面低半音。':'Complete mass; Kyrie starts at 00:00. The uploader notes that the first two movements sound a semitone below the score.',
 '视频为整部弥撒；Kyrie 从 04:07 开始，附总谱。':'Complete mass with score; Kyrie starts at 04:07.'
});
Object.assign(translations,{
 '从中世纪到二十世纪，交流作品、听辨特征与录音版本。':'Discuss works, listening details, and recordings from the Medieval period to the 20th century.',
 '作品讨论':'Work discussion','曲目讨论':'Work discussion','写下你的回复':'Write your reply','删除我的评论':'Delete my comment','加载更多回复':'Load more replies','发布回复':'Post reply',
 '收起回复':'Hide replies','无法加载回复，请重试。':'Could not load replies. Please try again.','暂时无法读取评论，请检查网络后重试。':'Could not load comments. Check your connection and try again.',
 '查看回复':'View replies','正在加载':'Loading','正在发布':'Posting','正在读取回复':'Loading replies','正在读取讨论':'Loading discussion',
 '评论已删除':'Comment deleted','评论已发布':'Comment posted','评论已发布。':'Comment posted.','还没有回复。':'No replies yet.','还没有评论。分享你的第一个发现。':'No comments yet. Share your first discovery.',
 '重新加载回复':'Reload replies','暂时无法读取收藏':'Could not load favorites','请检查网络后重试。':'Check your connection and try again.','请稍候。':'Please wait.',
 '取消收藏':'Remove favorite','收藏这首作品':'Save this work','搜索结果':'Search results','全部时期':'All periods',
 '头像保存失败，请重试。':'Could not save the avatar. Please try again.','头像已更新':'Avatar updated','昵称保存失败，请重试。':'Could not save the display name. Please try again.','昵称已更新':'Display name updated','昵称没有变化':'Display name is unchanged',
 '正在保存头像':'Saving avatar','正在保存昵称':'Saving display name','消息暂时无法加载，请稍后重试。':'Could not load messages. Please try again.',
 '已同步至云端':'Synced to cloud','云端数据已更新':'Cloud data updated','正在读取云端…':'Loading from cloud…','正在上传云端…':'Uploading…','无法读取云端':'Could not load from cloud',
 '你的听辨账号':'Your listening account','展开收听版本':'Show listening versions','处理中…':'Processing…'
});
Object.assign(translations, {
 '打开聆听室':'Open the listening room','聆听室':'Listening room','进入聆听室':'Enter the listening room',
 '跳到聆听室':'Skip to the listening room','返回曲目库':'Back to library','全部曲目':'All works',
 '播放当前列表':'Play this list','仅看有站内音频的曲目':'On-site audio only','查看专辑':'View album','播放队列':'Playback queue','盲听测试':'Blind listening'
});
const originalText=new WeakMap(),originalPlaceholder=new WeakMap();
const placeholders={'搜索作品、作曲家或编号…':'Search works, composers, or numbers…','输入你的密码':'Enter your password','输入管理员提供的邀请码':'Enter your invitation code','接收确认邮件的邮箱':'Email for confirmation','评论中显示的名字':'Your public display name','至少 8 位密码':'At least 8 characters','听到了什么特征？更喜欢哪个录音版本？':'What did you hear? Which recording do you prefer?'};
export function createPresentation({getToken,isAdmin,apiFetch,notify}){
 const $=id=>document.getElementById(id);let language=localStorage.getItem('qe-language')||'zh',theme=localStorage.getItem('qe-theme')||'light',content={...INTRO},ready=false,changing=false;
 const endpoint=`${SUPABASE_URL}/rest/v1/qe_site_introduction?id=eq.true`;
 function translate(root=document.body){if(changing)return;changing=true;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement?.closest('script,style,textarea,input,#welcomeContent,#introZh,#introEn,.recording-slot-name,.message-body,.comment-body'))continue;const raw=node.nodeValue;const t=raw.trim();if(language==='en'&&translations[t]){originalText.set(node,raw);node.nodeValue=raw.replace(t,translations[t]);}else if(language==='zh'&&originalText.has(node)){node.nodeValue=originalText.get(node);originalText.delete(node);}}for(const el of root.querySelectorAll?.('[placeholder]')||[]){const value=el.getAttribute('placeholder');if(language==='en'&&placeholders[value]){originalPlaceholder.set(el,value);el.setAttribute('placeholder',placeholders[value]);}else if(language==='zh'&&originalPlaceholder.has(el)){el.setAttribute('placeholder',originalPlaceholder.get(el));originalPlaceholder.delete(el);}}changing=false;}
 function renderIntro(){const target=$('welcomeContent');target.replaceChildren(...content[language].split(/\n+/).filter(Boolean).map(line=>{const p=document.createElement('p');p.textContent=line;return p;}));}
 function apply(){document.documentElement.lang=language==='en'?'en':'zh-CN';document.documentElement.dataset.theme=theme;$('languageToggle').textContent=language==='en'?'中':'EN';$('themeToggle').textContent=theme==='dark'?'☀':'☾';translate();renderIntro();}
 async function load(){try{const response=await apiFetch(`${endpoint}&select=content_zh,content_en`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});const rows=await response.json();if(!Array.isArray(rows)||!rows.length)throw Error();ready=true;content={zh:rows[0].content_zh||INTRO.zh,en:rows[0].content_en||INTRO.en};renderIntro();}catch{ready=false;}}
 async function adminRequest(path,options={}){const token=await getToken();if(!token||!isAdmin())throw Error('请先以管理员身份登录');return apiFetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers}});}
 async function invites(count=0){const response=await adminRequest('rpc/qe_admin_invites',{method:'POST',body:JSON.stringify({create_count:count})});const data=await response.json();const list=$('inviteList');list.replaceChildren(...data.map(item=>{const row=document.createElement('div');row.className='invite-row';const code=document.createElement('code');code.textContent=item.code;const state=document.createElement('span');state.textContent=item.used_at?'已使用':'可使用';row.append(code,state);return row;}));}
 $('languageToggle').addEventListener('click',()=>{language=language==='zh'?'en':'zh';localStorage.setItem('qe-language',language);apply();});
 $('themeToggle').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';localStorage.setItem('qe-theme',theme);apply();});
 $('showIntroduction').addEventListener('click',()=>{if(!$('welcomeDialog').open)$('welcomeDialog').showModal();});
 $('closeWelcome').addEventListener('click',()=>{localStorage.setItem('qe-welcome-hidden',String($('welcomeNever').checked));$('welcomeDialog').close();});
 $('welcomeDialog').addEventListener('cancel',()=>localStorage.setItem('qe-welcome-hidden',String($('welcomeNever').checked)));
 $('profileSiteSettings').addEventListener('click',async()=>{if(!isAdmin())return;$('introZh').value=content.zh;$('introEn').value=content.en;$('settingsStatus').textContent='';$('siteSettingsDialog').showModal();try{await invites();}catch{$('settingsStatus').textContent='无法读取邀请码，请确认数据库更新已完成。';}});
 $('closeSiteSettings').addEventListener('click',()=>$('siteSettingsDialog').close());
 $('saveIntroduction').addEventListener('click',async()=>{try{const zh=$('introZh').value.trim(),en=$('introEn').value.trim();if(!zh||!en)throw Error('请填写中英文介绍');const response=await adminRequest('qe_site_introduction?id=eq.true',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({content_zh:zh,content_en:en,updated_at:new Date().toISOString()})});const updated=await response.json();if(!Array.isArray(updated)||updated.length!==1)throw Error('未能确认保存，请重试');content={zh,en};renderIntro();$('settingsStatus').textContent='介绍已保存';}catch(e){$('settingsStatus').textContent=e.message||'保存失败';}});
 $('createInvites').addEventListener('click',async()=>{try{await invites(10);$('settingsStatus').textContent='已生成 10 个邀请码';}catch(e){$('settingsStatus').textContent=e.message||'生成失败';}});
 $('welcomeNever').checked=localStorage.getItem('qe-welcome-hidden')==='true';
 apply();new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType===1)translate(node);else if(node.nodeType===3&&node.parentElement)translate(node.parentElement);}}).observe(document.body,{childList:true,subtree:true});
 load();if(localStorage.getItem('qe-welcome-hidden')!=='true')$('welcomeDialog').showModal();
 return {isReady:()=>ready,translate};
}
