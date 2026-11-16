import { earlyRecordings } from './early-recordings.js?v=1.2.0';
import { icon } from './icons.js?v=3';

// Only the Medieval pilot has a recording lookup. Add another numbered entry to extend it.
// Recording URLs are obtained from the provider, never guessed from a work's title.
export const mediaCatalog = {
  1: {query:'Missa de Angelis Kyrie Gregorian', title:/kyrie/i, context:/angelis/i},
  2: {query:'Requiem aeternam Gregorian chant', title:/requiem.*aeternam/i, context:/gregorian|chant|plainchant|gregorien|monks|schola/i},
  3: {query:'Dies irae Gregorian chant', title:/dies\s+irae/i, context:/gregorian|chant|plainchant|gregorien|monks|schola/i},
  4: {query:'Sumer is icumen in', title:/s[ua]m+[ae]?r.*[iy]?[ck]umen|sumer.*icumen/i, context:/.*/},
  5: {query:'Machaut Messe de Nostre Dame Kyrie', title:/kyrie/i, context:/machaut|messe.*n[oô]tr[ee].*dame/i},
};

// Candidate recordings were checked against YouTube search/video metadata on 2026-11-16.
// Keep variant notes visible: identical mass movements can refer to different settings or performances.
export const youtubeRecordings = {
  ...earlyRecordings,
  1: [
    {title:'Missa de Angelis · Kyrie · Schola Gregoriana Mediolanensis',url:'https://www.youtube.com/watch?v=2_IUdY21fQM',note:'唱片发行版；曲名明确标为 Missa de Angelis – Kyrie。'},
    {title:'Missa VIII de Angelis · Kyrie',url:'https://www.youtube.com/watch?v=dG-gOLUnAN0',note:'独立 Kyrie 片段。'},
    {title:'Missa de Angelis · Kyrie · 练习版',url:'https://www.youtube.com/watch?v=Ii9ircZp4vk',note:'现代谱与方形音符对照练习，适合听唱法差异。'},
  ],
  2: [
    {title:'Requiem aeternam · Harpa Dei',url:'https://www.youtube.com/watch?v=DPGfRCKE5Nw',note:'独立圣咏版本。'},
    {title:'Requiem aeternam · Missa pro defunctis',url:'https://www.youtube.com/watch?v=HPVOI0XsHNQ',note:'独立 Introitus；发布者标注 pipeorgan；伴奏及演绎方式待试听核对。'},
    {title:'Missa pro defunctis · 完整安魂弥撒',url:'https://www.youtube.com/watch?v=vDcrY7cuHYw',start:19,note:'完整套曲；Requiem aeternam 在 00:19，后续 Graduale 在 03:49。'},
  ],
  3: [
    {title:'Dies irae · Harpa Dei',url:'https://www.youtube.com/watch?v=oxra-suTNoY',note:'独立圣咏版本。'},
    {title:'Dies Irae · Tu Es Petrus',url:'https://www.youtube.com/watch?v=2OBB5-bP6qs',note:'独立圣咏，附歌词与译文。'},
    {title:'Missa pro defunctis · 完整安魂弥撒',url:'https://www.youtube.com/watch?v=vDcrY7cuHYw',start:538,note:'完整套曲中的 Sequentia；Dies irae 从 08:58 开始。'},
  ],
  4: [
    {title:'Sumer is icumen in · Hilliard Ensemble',url:'https://www.youtube.com/watch?v=b4FU8yz4BYY',note:'描述注明 Hilliard Ensemble 演唱。'},
    {title:'Sumer is icumen in · 六声部手稿复原',url:'https://www.youtube.com/watch?v=Fxx7ZIfJqr4',note:'依 Harley 978 手稿六声部演唱，复原后与常见改编略异。'},
    {title:'Sumer is icumen in · Huelgas Ensemble',url:'https://www.youtube.com/watch?v=206cNGCPsXA',note:'Huelgas Ensemble 演唱，附动态乐谱。'},
  ],
  5: [
    {title:'Messe de Nostre Dame · Kyrie · 分段对照版',url:'https://www.youtube.com/watch?v=lOVsY1rxJB8',note:'Kyrie 分段呈现素歌与复调交替。'},
    {title:'Messe de Nostre Dame · Kyrie · micrologus2 上传',url:'https://www.youtube.com/watch?v=Y47JdUI_PhE',note:'独立 Kyrie 演绎。'},
    {title:'Messe de Nostre Dame · Kyrie · Ensemble Gilles Binchois',url:'https://www.youtube.com/watch?v=ZBQxrD3d7MI',note:'视频为整部弥撒；Kyrie 从 00:00 开始，说明提示前两段比谱面低半音。'},
    {title:'Messe de Nostre Dame · Kyrie · Diabolus in Musica',url:'https://www.youtube.com/watch?v=rOu2gnLibHo',start:247,note:'视频为整部弥撒；Kyrie 从 04:07 开始，附总谱。'},
  ],
};

export function youtubeVideoId(value) {
  try {
    const url=new URL(value);
    if(url.protocol!=='https:')return null;
    let id=null;
    if(url.hostname==='youtu.be')id=url.pathname.slice(1).split('/')[0];
    else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(url.hostname)) {
      if(url.pathname==='/watch')id=url.searchParams.get('v');
      else id=url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '')?id:null;
  } catch{return null;}
}

function platformLink(name, url, logo) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = `platform-link ${logo}`;
  link.setAttribute('aria-label', `在 ${name} 搜索这首作品（新标签页）`);
  link.append(document.createTextNode(name), icon('external', 12));
  return link;
}

export function createMediaControls(id, fullText) {
  const block = document.createElement('div');
  block.className = 'media-block';
  const versionDetails=document.createElement('details');
  versionDetails.className='recording-versions';
  versionDetails.addEventListener('toggle',()=>{
    if(!versionDetails.open){
      versionDetails.querySelectorAll('.youtube-embed-holder').forEach(holder=>holder.replaceChildren());
      versionDetails.querySelectorAll('.version-preview').forEach(button=>{button.setAttribute('aria-expanded','false');});
    }
  });
  versionDetails.open=true;
  const summary=document.createElement('summary');
  const summaryTitle=document.createElement('span');summaryTitle.className='recording-versions-title';summaryTitle.textContent='收听版本';
  const summaryPlatforms=document.createElement('span');summaryPlatforms.className='recording-versions-platforms';summaryPlatforms.textContent='YouTube · 网易云';
  summary.append(icon('headphones',15),summaryTitle,summaryPlatforms,icon('chevron',14));
  const contents=document.createElement('div');contents.className='recording-versions-content';
  const header=document.createElement('div');header.className='recording-platform-header';
  const platformName=document.createElement('span');platformName.className='recording-platform-name';
  const youtubeIcon=document.createElement('img');youtubeIcon.src='./assets/icons/youtube.svg';youtubeIcon.alt='';youtubeIcon.width=16;youtubeIcon.height=16;
  platformName.append(youtubeIcon,document.createTextNode('YouTube'));
  const query=mediaCatalog[id]?.query || fullText;
  const youtubeSearch=platformLink('搜索',`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'youtube');
  youtubeSearch.setAttribute('aria-label',`在 YouTube 搜索第 ${id} 首作品（新标签页）`);
  header.append(platformName,youtubeSearch);contents.append(header);
  const entries=youtubeRecordings[id] || [];
  const versionList=document.createElement('div');versionList.className='recording-slots';
  for(let index=0;index<entries.length;index++){
    const entry=entries[index];
    const video=youtubeVideoId(entry?.url);
    const row=document.createElement('div');row.className='recording-slot';
    const number=document.createElement('span');number.className='recording-slot-number';number.textContent=String(index+1).padStart(2,'0');
    const name=document.createElement('button');name.type='button';name.className='recording-slot-name version-preview';name.textContent=video && entry.title ? entry.title : `录音版本 ${index+1}`;
    row.append(number,name);
    if(video){
      const preview=name;
      preview.setAttribute('aria-expanded','false');
      const link=document.createElement('a');link.href=entry.start ? `${entry.url}&t=${entry.start}s` : entry.url;link.target='_blank';link.rel='noopener noreferrer';link.className='version-open';link.textContent='打开 ↗';
      const holder=document.createElement('div');holder.className='youtube-embed-holder';
      preview.addEventListener('click',()=>{
        const open=preview.getAttribute('aria-expanded')==='true';
        document.querySelectorAll('.youtube-embed-holder').forEach(element=>element.replaceChildren());
        document.querySelectorAll('.version-preview').forEach(button=>button.setAttribute('aria-expanded','false'));
        if(!open){const frame=document.createElement('iframe');frame.className='youtube-embed';frame.title=`${entry.title || fullText} · YouTube`;
          frame.src=`https://www.youtube-nocookie.com/embed/${video}${entry.start ? `?start=${entry.start}` : ''}`;frame.allow='encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.loading='lazy';
          holder.append(frame);preview.setAttribute('aria-expanded','true');}
      });
      row.addEventListener('click',event=>{if(!event.target.closest('button,a,iframe'))preview.click();});
      row.append(link,holder);
    } else {
      const pending=document.createElement('span');pending.className='recording-slot-pending';pending.textContent='待添加链接';row.append(pending);
    }
    if(entry.note){const note=document.createElement('span');note.className='recording-slot-note';note.textContent=entry.note;row.append(note);}
    versionList.append(row);
  }
  contents.append(versionList);
  const netease=document.createElement('details');netease.className='recording-netease';
  const neteaseSummary=document.createElement('summary');neteaseSummary.className='netease-summary';
  const neteaseName=document.createElement('span');neteaseName.className='recording-platform-name';
  const neteaseIcon=document.createElement('img');neteaseIcon.src='./assets/icons/neteasecloudmusic.svg';neteaseIcon.alt='';neteaseIcon.width=16;neteaseIcon.height=16;
  neteaseName.append(neteaseIcon,document.createTextNode('网易云音乐'));
  const neteaseSearch=platformLink('打开搜索',`https://music.163.com/#/search/m/?s=${encodeURIComponent(query)}&type=1`,'neteasecloudmusic');
  neteaseSearch.setAttribute('aria-label',`在网易云音乐搜索第 ${id} 首作品（新标签页）`);
  neteaseSummary.append(neteaseName,icon('chevron',14));netease.append(neteaseSummary,neteaseSearch);contents.append(netease);versionDetails.append(summary,contents);
  block.append(versionDetails);
  return block;
}
