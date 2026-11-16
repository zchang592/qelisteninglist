import { icon } from './icons.js';

// Only the Medieval pilot has a recording lookup. Add another numbered entry to extend it.
// Recording URLs are obtained from the provider, never guessed from a work's title.
export const mediaCatalog = {
  1: {query:'Missa de Angelis Kyrie Gregorian', title:/kyrie/i, context:/angelis/i},
  2: {query:'Requiem aeternam Gregorian chant', title:/requiem.*aeternam/i, context:/gregorian|chant|plainchant|gregorien|monks|schola/i},
  3: {query:'Dies irae Gregorian chant', title:/dies\s+irae/i, context:/gregorian|chant|plainchant|gregorien|monks|schola/i},
  4: {query:'Sumer is icumen in', title:/s[ua]m+[ae]?r.*[iy]?[ck]umen|sumer.*icumen/i, context:/.*/},
  5: {query:'Machaut Messe de Nostre Dame Kyrie', title:/kyrie/i, context:/machaut|messe.*n[oô]tr[ee].*dame/i},
};

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
  const image = document.createElement('img');
  image.src = `./assets/icons/${logo}.svg`;
  image.alt = '';
  image.width = 15;
  image.height = 15;
  image.loading = 'lazy';
  link.append(image, document.createTextNode(name), icon('external', 12));
  return link;
}

export function createMediaControls(id, fullText) {
  if (!mediaCatalog[id]) return null;
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
  const links = document.createElement('div');
  links.className = 'platform-links';
  links.append(
    platformLink('YouTube', `https://www.youtube.com/results?search_query=${encodeURIComponent(mediaCatalog[id].query)}`, 'youtube'),
    platformLink('Spotify', `https://open.spotify.com/search/${encodeURIComponent(mediaCatalog[id].query)}`, 'spotify')
  );
  player.append(select, recordingTitle, audio, listenFull);
  block.append(top, player, feedback, links);

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
