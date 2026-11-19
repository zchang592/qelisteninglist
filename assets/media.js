import { earlyRecordings } from './early-recordings.js?v=1.5.7';
import { laterRecordings } from './later-recordings.js?v=1.5.7';
import { icon } from './icons.js?v=3';
import { workParts, scopeNotes } from './work-parts.js?v=1.5.7';
import { localRecordings, recordingsForWork } from './local-recordings.js?v=1.6.6.1';

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
  ...laterRecordings,
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

export function bilibiliVideo(value) {
  const input=String(value || '').trim();
  if(/^BV[0-9A-Za-z]{10}$/.test(input))return {id:input,page:1};
  try {
    const url=new URL(input);
    if(url.protocol!=='https:' || !['www.bilibili.com','bilibili.com','m.bilibili.com'].includes(url.hostname))return null;
    const match=url.pathname.match(/^\/video\/(BV[0-9A-Za-z]{10})(?:\/|$)/);
    if(!match)return null;
    const p=url.searchParams.get('p');
    if(p!==null && (!/^[1-9]\d{0,2}$/.test(p)))return null;
    return {id:match[1],page:p?Number(p):1};
  }catch{return null;}
}

function clearEmbeddedPlayers() {
  document.querySelectorAll('.youtube-embed-holder,.bilibili-embed-holder').forEach(element=>element.replaceChildren());
  document.querySelectorAll('.version-preview').forEach(button=>button.setAttribute('aria-expanded','false'));
  document.querySelectorAll('.bilibili-section [data-video-link]').forEach(link=>{link.hidden=true;});
}

function pauseAudioPlayers() {
  document.querySelectorAll('.local-recording audio').forEach(audio=>audio.pause());
}

function youtubeFrame(video, start, title, autoplay) {
  const frame=document.createElement('iframe');
  const url=new URL(`https://www.youtube-nocookie.com/embed/${video}`);
  if(start)url.searchParams.set('start',start);
  if(autoplay)url.searchParams.set('autoplay','1');
  frame.className='youtube-embed';frame.title=`${title} · YouTube`;frame.src=url.href;
  frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.loading='lazy';
  return frame;
}

function recordingPlayer(recording, fullText) {
  const player = document.createElement('div');
  player.className = 'local-recording';
  const label = document.createElement('span');
  label.className = 'recording-platform-name';
  label.textContent = recording.name || '站内音频';
  const credit = document.createElement('span');
  credit.className = 'local-recording-credit';
  credit.textContent = recording.credit || '';
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.preload = 'none';
  audio.src = recording.src;
  audio.setAttribute('aria-label', [fullText, recording.name, recording.credit].filter(Boolean).join(' · '));
  audio.addEventListener('play', () => {
    document.querySelectorAll('.local-recording audio').forEach(other => { if (other !== audio) other.pause(); });
    clearEmbeddedPlayers();
  });
  player.append(label, credit, audio);
  return player;
}

function sequencePlayer(work, fullText) {
  const { sequence, selectedPart = 0 } = work;
  const player = recordingPlayer({ src: sequence[selectedPart].src }, fullText);
  const audio = player.querySelector('audio');
  const controls = document.createElement('div');
  controls.className = 'local-sequence-controls';
  const label = document.createElement('label');
  label.textContent = '乐章 / 幕';
  const select = document.createElement('select');
  select.append(...sequence.map((part, index) => new Option(part.name, index)));
  label.append(select);
  controls.append(label);
  let current = selectedPart;
  function showPart(index) {
    current = index;
    select.value = String(index);
    audio.setAttribute('aria-label', `${fullText} · ${sequence[index].name}`);
  }
  function changePart(index, play) {
    showPart(index);
    audio.src = sequence[index].src;
    if (play) audio.play().catch(() => {});
  }
  showPart(selectedPart);
  select.addEventListener('change', () => changePart(Number(select.value), true));
  audio.addEventListener('ended', () => {
    if (sequence[current + 1]) changePart(current + 1, true);
    else changePart(selectedPart, false);
  });
  if (selectedPart) {
    const complete = document.createElement('button');
    complete.type = 'button';
    complete.className = 'text-button';
    complete.textContent = '从序幕播放全剧';
    complete.addEventListener('click', () => changePart(0, true));
    controls.append(complete);
  }
  audio.before(controls);
  return player;
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
      versionDetails.querySelectorAll('.youtube-embed-holder,.bilibili-embed-holder').forEach(holder=>holder.replaceChildren());
      versionDetails.querySelectorAll('.version-preview').forEach(button=>{button.setAttribute('aria-expanded','false');});
      versionDetails.querySelectorAll('.bilibili-section [data-video-link]').forEach(link=>{link.hidden=true;});
    }
  });
  versionDetails.open=true;
  const summary=document.createElement('summary');
  const summaryTitle=document.createElement('span');summaryTitle.className='recording-versions-title';summaryTitle.textContent='YouTube 录音版本';
  summary.append(icon('headphones',15),summaryTitle,icon('chevron',14));
  const contents=document.createElement('div');contents.className='recording-versions-content';
  const sources = recordingsForWork(id);
  const work = localRecordings[id];
  if (work?.sequence) block.append(sequencePlayer(work, fullText));
  else if (sources.length === 1) block.append(recordingPlayer(sources[0], fullText));
  else if (sources.length > 1) {
    const playlist = document.createElement('details');
    playlist.className = 'local-recording local-recording-parts';
    playlist.open = true;
    const heading = document.createElement('summary');
    heading.textContent = `站内音频 · ${sources.length} 段`;
    playlist.append(heading, ...sources.map(recording => recordingPlayer(recording, fullText)));
    block.append(playlist);
  }
  const header=document.createElement('div');header.className='recording-platform-header';
  const platformName=document.createElement('span');platformName.className='recording-platform-name';
  const youtubeIcon=document.createElement('img');youtubeIcon.src='./assets/icons/youtube.svg';youtubeIcon.alt='';youtubeIcon.width=16;youtubeIcon.height=16;
  platformName.append(youtubeIcon,document.createTextNode('YouTube'));
  const query=mediaCatalog[id]?.query || fullText;
  const youtubeSearch=platformLink('搜索',`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'youtube');
  youtubeSearch.setAttribute('aria-label',`在 YouTube 搜索第 ${id} 首作品（新标签页）`);
  header.append(platformName,youtubeSearch);contents.append(header);
  if(scopeNotes[id]){
    const note=document.createElement('p');note.className='work-scope-note';note.textContent=scopeNotes[id];contents.append(note);
  }
  if(workParts[id]){
    const parts=document.createElement('details');parts.className='work-parts';parts.open=true;
    const partsSummary=document.createElement('summary');partsSummary.append(document.createTextNode('原清单指定的乐章 / 选曲'),icon('chevron',14));
    const partsList=document.createElement('div');partsList.className='work-parts-list';
    const workQuery=fullText.replace(/\s*\((?:Movements?|Nos\.|Variations?)\b[^)]*\)/gi,'');
    for(const part of workParts[id]){
      const item=document.createElement('div');item.className='work-part';
      if(part.video){
        const button=document.createElement('button');button.type='button';button.className='work-part-name version-preview';button.textContent=part.name;button.setAttribute('aria-expanded','false');
        const link=document.createElement('a');link.className='version-open';link.target='_blank';link.rel='noopener noreferrer';link.href=`https://www.youtube.com/watch?v=${part.video}${part.start?`&t=${part.start}s`:''}`;link.textContent='打开 ↗';
        const holder=document.createElement('div');holder.className='youtube-embed-holder';
        button.addEventListener('click',()=>{
          const open=button.getAttribute('aria-expanded')==='true';clearEmbeddedPlayers();
          if(!open){pauseAudioPlayers();holder.append(youtubeFrame(part.video,part.start,`${fullText} · ${part.name}`,button.dataset.autoplay));button.setAttribute('aria-expanded','true');}
        });
        item.append(button,link,holder);
        if(part.start!==undefined){const note=document.createElement('small');note.className='work-part-note';note.textContent='完整录音定位';item.append(note);}
      }else if(part.unresolved){
        const name=document.createElement('span');name.className='work-part-name';name.textContent=part.name;
        const pending=document.createElement('span');pending.className='work-part-note';pending.textContent='待核对';item.append(name,pending);
      }else{
        const name=document.createElement('span');name.className='work-part-name';name.textContent=part.name;
        const search=platformLink('搜索',`https://www.youtube.com/results?search_query=${encodeURIComponent(`${workQuery} ${part.name}`)}`,'part-search');search.setAttribute('aria-label',`在 YouTube 搜索 ${part.name}（新标签页）`);
        item.append(name,search);
      }
      partsList.append(item);
    }
    parts.addEventListener('toggle',()=>{if(!parts.open){parts.querySelectorAll('.youtube-embed-holder').forEach(holder=>holder.replaceChildren());parts.querySelectorAll('.version-preview').forEach(button=>button.setAttribute('aria-expanded','false'));}});
    parts.append(partsSummary,partsList);contents.append(parts);
    const label=document.createElement('p');label.className='work-recordings-label';label.textContent='整部作品 / 其他录音';contents.append(label);
  }
  const entries=youtubeRecordings[id] || [];
  const versionList=document.createElement('div');versionList.className='recording-slots';
  if(!entries.length){const pending=document.createElement('p');pending.className='recording-unavailable';pending.textContent='录音链接待补充，可先使用上方搜索。';versionList.append(pending);}
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
        clearEmbeddedPlayers();
        if(!open){pauseAudioPlayers();holder.append(youtubeFrame(video,entry.start,entry.title || fullText,preview.dataset.autoplay));preview.setAttribute('aria-expanded','true');}
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
  versionDetails.append(summary,contents);block.append(versionDetails);
  const other=document.createElement('details');other.className='recording-versions other-platforms';
  const otherSummary=document.createElement('summary');
  const otherTitle=document.createElement('span');otherTitle.className='recording-versions-title';otherTitle.textContent='其他平台搜索';
  otherSummary.append(icon('external',15),otherTitle,icon('chevron',14));
  const otherContents=document.createElement('div');otherContents.className='recording-versions-content';
  const links=document.createElement('div');links.className='other-platform-links';
  const biliSearch=platformLink('在 B 站搜索',`https://search.bilibili.com/all?keyword=${encodeURIComponent(query)}`,'bilibili');
  const neteaseSearch=platformLink('在网易云搜索',`https://music.163.com/#/search/m/?s=${encodeURIComponent(query)}&type=1`,'neteasecloudmusic');
  neteaseSearch.setAttribute('aria-label',`在网易云音乐搜索第 ${id} 首作品（新标签页）`);
  links.append(biliSearch,neteaseSearch);otherContents.append(links);
  if(id>=1 && id<=5){
    const bili=document.createElement('details');bili.className='recording-netease bilibili-section';
    const biliSummary=document.createElement('summary');biliSummary.className='netease-summary';
    const biliName=document.createElement('span');biliName.className='recording-platform-name';biliName.textContent='B 站链接播放器（可选）';
    biliSummary.append(biliName,icon('chevron',14));
    const form=document.createElement('form');form.className='bilibili-form';
    const label=document.createElement('label');label.textContent='粘贴 B 站视频链接或 BV 号，试听对应版本';
    const input=document.createElement('input');input.type='text';input.placeholder='https://www.bilibili.com/video/BV…';input.autocomplete='off';input.required=true;
    label.append(input);
    const submit=document.createElement('button');submit.type='submit';submit.className='secondary-btn';submit.textContent='载入播放器';
    const feedback=document.createElement('p');feedback.className='bilibili-feedback';feedback.setAttribute('role','status');
    const holder=document.createElement('div');holder.className='bilibili-embed-holder';
    const open=document.createElement('a');open.className='platform-link';open.target='_blank';open.rel='noopener noreferrer';open.textContent='在 B 站打开 ↗';open.hidden=true;
    form.append(label,submit);bili.append(biliSummary,form,feedback,holder,open);otherContents.append(bili);
    bili.addEventListener('toggle',()=>{if(!bili.open){holder.replaceChildren();open.hidden=true;}});
    form.addEventListener('submit',event=>{
      event.preventDefault();const video=bilibiliVideo(input.value);
      if(!video){feedback.textContent='请输入完整的 B 站视频链接或 BV 号。';return;}
      feedback.textContent='';clearEmbeddedPlayers();pauseAudioPlayers();
      const frame=document.createElement('iframe');frame.className='youtube-embed';frame.title=`${fullText} · Bilibili`;
      frame.src=`https://player.bilibili.com/player.html?bvid=${video.id}&page=${video.page}&autoplay=0`;
      frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.loading='lazy';holder.append(frame);
      open.href=`https://www.bilibili.com/video/${video.id}?p=${video.page}`;open.dataset.videoLink='true';open.hidden=false;
    });
  }
  other.addEventListener('toggle',()=>{if(!other.open){other.querySelectorAll('.bilibili-embed-holder').forEach(holder=>holder.replaceChildren());other.querySelectorAll('[data-video-link]').forEach(link=>{link.hidden=true;});}});
  other.append(otherSummary,otherContents);block.append(other);
  return block;
}
