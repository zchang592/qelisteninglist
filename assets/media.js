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

// Add verified recordings later as { title, url } entries under their work ID.
// Until then, the four visible slots are clearly marked as awaiting links.
export const youtubeRecordings = {};

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

let serial = 0;
const cache = new Map();

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const name = `qeRecording${++serial}`;
    const script = document.createElement('script');
    const finish = (error, result) => {
      clearTimeout(timer);
      delete window[name];
      script.remove();
      error ? reject(error) : resolve(result);
    };
    const timer = setTimeout(() => finish(new Error('试听服务响应超时')), 10000);
    window[name] = result => finish(null, result);
    script.onerror = () => finish(new Error('无法连接试听服务'));
    script.src = `${url}&callback=${name}`;
    script.referrerPolicy = 'no-referrer';
    document.head.append(script);
  });
}

export function matchingRecordings(id, results) {
  const work = mediaCatalog[id];
  if (!work || !Array.isArray(results)) return [];
  const seen = new Set();
  return results.filter(recording => {
    if (!recording || typeof recording.trackName !== 'string' || typeof recording.previewUrl !== 'string') return false;
    let preview;
    try { preview = new URL(recording.previewUrl); } catch { return false; }
    if (preview.protocol !== 'https:' || !preview.hostname.endsWith('.mzstatic.com')) return false;
    const context = `${recording.trackName} ${recording.collectionName || ''} ${recording.artistName || ''}`;
    if (!work.title.test(recording.trackName) || !work.context.test(context) || seen.has(recording.previewUrl)) return false;
    seen.add(recording.previewUrl);
    return true;
  }).slice(0, 5);
}

async function lookup(id) {
  if (cache.has(id)) return cache.get(id);
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(mediaCatalog[id].query)}&entity=song&media=music&country=US&limit=50`;
  let response;
  try {
    const r = await fetch(url, {signal:AbortSignal.timeout(7000), referrerPolicy:'no-referrer'});
    if (!r.ok) throw new Error('试听服务暂不可用');
    response = await r.json();
  } catch {
    // The public Search API supports JSONP on browsers where CORS is unavailable.
    response = await jsonp(url);
  }
  const recordings = matchingRecordings(id, response.results);
  if (!recordings.length) throw new Error('暂未找到符合这首作品的试听录音。请使用下方平台搜索。');
  cache.set(id, recordings);
  return recordings;
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
  const top = document.createElement('div');
  top.className = 'media-top';
  const load = document.createElement('button');
  load.type = 'button';
  load.className = 'preview-button';
  load.append(icon('play', 15), document.createTextNode('载入试听'));
  load.setAttribute('aria-label', `载入第 ${id} 首的录音试听`);
  const source = document.createElement('span');
  source.className = 'media-source';
  source.textContent = '片段试听 · Apple Music';
  top.append(load, source);

  const player = document.createElement('div');
  player.className = 'preview-player';
  player.hidden = true;
  const select = document.createElement('select');
  select.setAttribute('aria-label', `选择第 ${id} 首的录音版本`);
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.preload = 'none';
  audio.setAttribute('aria-label', `第 ${id} 首的音频片段`);
  const recordingTitle = document.createElement('p');
  recordingTitle.className = 'recording-title';
  const listenFull = document.createElement('a');
  listenFull.className = 'recording-link';
  listenFull.target = '_blank';
  listenFull.rel = 'noopener noreferrer';
  listenFull.textContent = '在 Apple Music 打开这份录音 ↗';
  const feedback = document.createElement('p');
  feedback.className = 'media-feedback';
  feedback.setAttribute('role', 'status');
  const versionDetails=document.createElement('details');
  versionDetails.className='recording-versions';
  if(id===1)versionDetails.open=true;
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
  for(let index=0;index<4;index++){
    const entry=entries[index];
    const video=youtubeVideoId(entry?.url);
    const row=document.createElement('div');row.className='recording-slot';
    const number=document.createElement('span');number.className='recording-slot-number';number.textContent=String(index+1).padStart(2,'0');
    const name=document.createElement('span');name.className='recording-slot-name';name.textContent=video && entry.title ? entry.title : `录音版本 ${index+1}`;
    row.append(number,name);
    if(video){
      const preview=document.createElement('button');preview.type='button';preview.className='version-preview';preview.textContent='播放';
      preview.setAttribute('aria-expanded','false');
      const link=document.createElement('a');link.href=entry.url;link.target='_blank';link.rel='noopener noreferrer';link.className='version-open';link.textContent='打开 ↗';
      const holder=document.createElement('div');holder.className='youtube-embed-holder';
      preview.addEventListener('click',()=>{
        const open=preview.getAttribute('aria-expanded')==='true';
        document.querySelectorAll('.youtube-embed-holder').forEach(element=>element.replaceChildren());
        document.querySelectorAll('.version-preview').forEach(button=>button.setAttribute('aria-expanded','false'));
        if(!open){const frame=document.createElement('iframe');frame.className='youtube-embed';frame.title=`${entry.title || fullText} · YouTube`;
          frame.src=`https://www.youtube-nocookie.com/embed/${video}`;frame.allow='encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.loading='lazy';
          holder.append(frame);preview.setAttribute('aria-expanded','true');}
      });
      row.append(preview,link,holder);
    } else {
      const pending=document.createElement('span');pending.className='recording-slot-pending';pending.textContent='待添加链接';row.append(pending);
    }
    versionList.append(row);
  }
  contents.append(versionList);
  const netease=document.createElement('div');netease.className='recording-netease';
  const neteaseName=document.createElement('span');neteaseName.className='recording-platform-name';
  const neteaseIcon=document.createElement('img');neteaseIcon.src='./assets/icons/neteasecloudmusic.svg';neteaseIcon.alt='';neteaseIcon.width=16;neteaseIcon.height=16;
  neteaseName.append(neteaseIcon,document.createTextNode('网易云音乐'));
  const neteaseSearch=platformLink('搜索',`https://music.163.com/#/search/m/?s=${encodeURIComponent(query)}&type=1`,'neteasecloudmusic');
  neteaseSearch.setAttribute('aria-label',`在网易云音乐搜索第 ${id} 首作品（新标签页）`);
  netease.append(neteaseName,neteaseSearch);contents.append(netease);versionDetails.append(summary,contents);
  player.append(select, recordingTitle, audio, listenFull);
  if(mediaCatalog[id])block.append(top, player, feedback);
  block.append(versionDetails);

  let recordings = [];
  function choose(index) {
    const recording = recordings[index];
    audio.pause();
    audio.src = recording.previewUrl;
    recordingTitle.textContent = `${recording.trackName} · ${recording.artistName || '演奏者未注明'}`;
    feedback.textContent = '';
    let target;
    try { target = new URL(recording.trackViewUrl); } catch { /* provider did not supply a destination */ }
    const safeTarget = target && target.protocol === 'https:' && ['music.apple.com','itunes.apple.com'].includes(target.hostname);
    listenFull.hidden = !safeTarget;
    if (safeTarget) listenFull.href = target.href;
  }
  select.addEventListener('change', () => choose(Number(select.value)));
  load.addEventListener('click', async () => {
    load.disabled = true;
    load.textContent = '正在查找录音…';
    feedback.textContent = '';
    try {
      recordings = await lookup(id);
      select.replaceChildren(...recordings.map((recording, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${recording.artistName || '未注明演奏者'} · ${recording.collectionName || recording.trackName}`;
        return option;
      }));
      choose(0);
      player.hidden = false;
      load.hidden = true;
      // Playback always requires a separate click; loading a sample never autoplays it.
    } catch (error) {
      feedback.textContent = error.message || '试听加载失败，请重试或在音乐平台打开。';
      load.replaceChildren(icon('refresh',15), document.createTextNode('重试试听'));
    } finally { load.disabled = false; }
  });
  audio.addEventListener('play', () => {
    document.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); });
    document.getElementById('listeningTitle').textContent = fullText;
    document.getElementById('listeningState').textContent = '正在试听';
  });
  const stopped = () => {
    if (![...document.querySelectorAll('audio')].some(a => !a.paused)) {
      document.getElementById('listeningState').textContent = '试听已暂停';
    }
  };
  audio.addEventListener('pause', stopped);
  audio.addEventListener('ended', stopped);
  audio.addEventListener('error', () => {
    feedback.textContent = '这份片段暂时无法播放，可切换录音版本或在下方平台打开。';
  });
  return block;
}
