import { icon } from './icons.js?v=1.6.4';
import { playbackUnitsForWork, recordingAlbums } from './local-recordings.js?v=1.6.5';
import { createVisualizer } from './player-visualizer.js?v=1.6.0';

function normalize(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function shuffleTracks(tracks) {
  const order = [...tracks];
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  return order;
}

export function buildPlayer({ data, favorites, openComments, openAuth, workDetails }) {
  const $ = id => document.getElementById(id);
  const root = $('playerView');
  const audio = $('playerAudio');
  audio.crossOrigin = 'anonymous';
  const trackList = $('playerTracks');
  const search = $('playerSearch');
  const group = $('playerGroup');
  const audioOnly = $('playerAudioOnly');
  const playSelection = $('playSelection');
  const queueDialog = $('playerQueueDialog');
  const albumDialog = $('playerAlbumDialog');
  const playButton = $('playerPlay');
  const seek = $('playerSeek');
  const periodLabels = data.map(([name]) => {
    const firstChinese = name.search(/[\u3400-\u9fff]/);
    return [name.slice(0, firstChinese).trim(), name.slice(firstChinese)];
  });
  const tracks = data.flatMap(([period, composers], periodIndex) => composers.flatMap(([composer, works]) => works.flatMap(([id, fullText]) => {
    const recordings = playbackUnitsForWork(id);
    const workTitle = fullText.split(' — ').slice(1).join(' — ') || fullText;
    return (recordings.length ? recordings : [undefined]).map(recording => ({
      id, composer, periodIndex, recording,
      title: [workTitle, recording?.name].filter(Boolean).join(' · '),
      searchable: normalize(`${period} ${composer} ${fullText} ${recording?.name || recording?.sequence?.map(part => part.name).join(' ') || ''}`),
    }));
  })));
  const onSite = tracks.filter(track => track.recording);
  const composers = [...new Set(tracks.map(track => track.composer))].sort((a, b) => a.localeCompare(b, 'en'));
  const visualizer = createVisualizer($('playerWaveform'), audio);
  const browseButtons = [...root.querySelectorAll('[data-browse]')];
  const trackRows = new Map();
  const groupExpansion = new Map();
  const tr = (zh, en) => document.documentElement.lang === 'en' ? en : zh;
  const periodName = index => tr(periodLabels[index][1], periodLabels[index][0]);
  let view = 'all';
  let selection = [];
  let queueSource = onSite;
  let queue = [...onSite];
  let current = queue[0];
  let loaded;
  let partIndex = 0;
  let loopFrom = 0;
  let shuffled = false;
  let repeat = 'off';
  let playRequest = 0;
  let favoriteViewSignature = '';
  const activeRecording = () => current?.recording.sequence?.[partIndex] ?? current?.recording;

  function label(control, name) {
    control.setAttribute('aria-label', name);
    control.title = name;
  }

  function setIcon(control, name, size) {
    if (control.dataset.currentIcon === name) return;
    control.replaceChildren(icon(name, size));
    control.dataset.currentIcon = name;
  }

  function makeIconButton(symbol, name, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'player-icon';
    label(button, name);
    setIcon(button, symbol, 17);
    button.addEventListener('click', action);
    return button;
  }

  function favoriteSignature() {
    const { signedIn, ready, loading, error } = favorites.snapshot();
    return JSON.stringify([signedIn, ready, loading, error, tracks.filter(track => favorites.has(track.id)).map(track => track.id)]);
  }

  function updateFavorites() {
    for (const button of root.querySelectorAll('[data-player-favorite]')) {
      const id = Number(button.dataset.playerFavorite);
      if (!id) continue;
      const saved = favorites.has(id);
      const name = saved ? tr('取消收藏', 'Remove favorite') : tr('收藏', 'Favorite');
      const title = button === $('playerFavorite') ? current.title : trackRows.get(button.closest('.player-row')).track.title;
      label(button, `${name} ${title}`);
      button.setAttribute('aria-pressed', String(saved));
      button.disabled = favorites.pending(id);
      if (button === $('playerFavorite')) button.lastElementChild.textContent = saved ? tr('已收藏', 'Favorited') : tr('收藏', 'Favorite');
    }
  }

  function makeRow(track) {
    const row = document.createElement('li');
    row.className = 'player-row';
    row.dataset.work = track.id;
    const action = document.createElement(track.recording ? 'button' : 'a');
    action.className = 'player-row-main';
    const symbol = document.createElement('span');
    symbol.className = 'player-row-symbol';
    if (track.recording) {
      action.type = 'button';
      action.classList.add('player-row-play');
      action.addEventListener('click', () => {
        if (track === current && loaded === track && !audio.ended) {
          if (audio.paused) playTrack(track);
          else pause();
        } else beginQueue(selection, track);
      });
    } else {
      action.classList.add('player-external');
      action.href = `./index.html?track=${track.id}`;
      label(action, tr(`查看 ${track.title} 的外部录音`, `View external recordings for ${track.title}`));
      setIcon(symbol, 'external', 16);
    }
    const identity = document.createElement('span');
    identity.className = 'player-row-identity';
    const title = document.createElement('span');
    title.className = 'player-row-title';
    title.textContent = track.title;
    const meta = document.createElement('small');
    const byline = [track.composer, periodName(track.periodIndex)];
    if (!track.recording) byline.push(tr('外部录音', 'External recordings'));
    meta.textContent = `${String(track.id).padStart(2, '0')} · ${byline.join(' · ')}`;
    identity.append(title, meta);
    action.append(symbol, identity);
    const seconds = track.recording?.sequence?.reduce((total, part) => total + part.duration, 0) ?? track.recording?.duration;
    if (seconds) {
      const duration = document.createElement('span');
      duration.className = 'player-row-duration';
      duration.textContent = formatTime(seconds);
      action.append(duration);
    }
    const actions = document.createElement('div');
    actions.className = 'player-row-actions';
    const favorite = makeIconButton('heart', tr('收藏', 'Favorite'), () => favorites.toggle(track.id));
    favorite.dataset.playerFavorite = track.id;
    const discuss = makeIconButton('comment', tr(`讨论 ${track.title}`, `Discuss ${track.title}`), () => openComments(track.id));
    discuss.setAttribute('aria-haspopup', 'dialog');
    const background = makeIconButton('book', tr(`曲目背景 · ${track.title}`, `About ${track.title}`), () => workDetails.openBackground(track.id));
    const report = makeIconButton('flag', tr(`反馈 · ${track.title}`, `Report ${track.title}`), () => workDetails.openReport(track.id));
    for (const button of [background, report]) button.setAttribute('aria-haspopup', 'dialog');
    actions.append(favorite, discuss, background, report);
    row.append(action, actions);
    trackRows.set(row, { track, row, action, symbol });
    return row;
  }

  function groupsInView() {
    const query = normalize(search.value.trim());
    const filtered = tracks.filter(track => {
      if (audioOnly.checked && !track.recording) return false;
      if (view === 'favorites' && !favorites.has(track.id)) return false;
      if (view === 'period' && group.value && String(track.periodIndex) !== group.value) return false;
      if (view === 'composer' && group.value && track.composer !== group.value) return false;
      return /^\d+$/.test(query) ? track.id === Number(query) : track.searchable.includes(query);
    });
    if (view === 'period') return periodLabels.map((_, index) => [periodName(index), filtered.filter(track => track.periodIndex === index)]);
    if (view === 'composer') return composers.map(composer => [composer, filtered.filter(track => track.composer === composer)]);
    return [['', filtered]];
  }

  function showEmpty(message, action, actionName) {
    const empty = document.createElement('div');
    empty.className = 'player-empty';
    const text = document.createElement('p');
    text.textContent = message;
    empty.append(text);
    if (action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'player-chip';
      button.textContent = actionName;
      button.addEventListener('click', action);
      empty.append(button);
    }
    trackList.append(empty);
  }

  function renderCatalog() {
    trackList.replaceChildren();
    trackRows.clear();
    const groups = groupsInView().filter(([, items]) => items.length);
    const visibleTracks = groups.flatMap(([, list]) => list);
    selection = visibleTracks.filter(track => track.recording);
    playSelection.disabled = !selection.length;
    const workCount = new Set(visibleTracks.map(track => track.id)).size;
    $('playerResults').textContent = tr(`${workCount} 首作品 · ${selection.length} 段可播放`, `${workCount} works · ${selection.length} playable`);
    if (view === 'favorites') {
      favoriteViewSignature = favoriteSignature();
      const { signedIn, loading, ready, error, count } = favorites.snapshot();
      if (!signedIn) return showEmpty(tr('登录后查看收藏的曲目。', 'Sign in to see your saved works.'), openAuth, tr('登录 / 注册', 'Sign in / Register'));
      if (loading) return showEmpty(tr('正在读取收藏', 'Loading favorites'));
      if (error || !ready) return showEmpty(tr('暂时无法读取收藏', 'Could not load favorites'), () => favorites.load(), tr('重新加载', 'Reload'));
      if (!count) return showEmpty(tr('还没有收藏', 'No favorites yet'));
    }
    if (!visibleTracks.length) {
      showEmpty(audioOnly.checked ? tr('没有符合筛选条件的站内音频。', 'No on-site recordings match these filters.') : tr('没有找到作品。', 'No matching works.'));
      return;
    }
    for (const [index, [heading, items]] of groups.entries()) {
      const list = document.createElement('ul');
      list.className = 'player-track-list';
      for (const track of items) list.append(makeRow(track));
      if (!heading) {
        trackList.append(list);
        continue;
      }
      const key = view === 'period' ? items[0].periodIndex : heading;
      const card = document.createElement('details');
      card.className = 'player-group';
      card.open = groupExpansion.get(key) ?? (index === 0);
      const summary = document.createElement('summary');
      const title = document.createElement('span');
      title.className = 'player-group-title';
      title.textContent = heading;
      const count = document.createElement('span');
      count.className = 'player-group-count';
      const works = new Set(items.map(track => track.id)).size;
      count.textContent = tr(`${works} 首`, `${works} ${works === 1 ? 'work' : 'works'}`);
      summary.append(title, count, icon('chevron', 16));
      card.append(summary, list);
      card.addEventListener('toggle', () => {
        if (card.isConnected) groupExpansion.set(key, card.open);
      });
      trackList.append(card);
    }
    updateFavorites();
    renderRowPlayback();
  }

  function resetGroupsAndRender() {
    groupExpansion.clear();
    renderCatalog();
  }

  function configureGroupFilter(value = '') {
    const byPeriod = view === 'period';
    $('playerGroupFilter').hidden = !byPeriod && view !== 'composer';
    if ($('playerGroupFilter').hidden) return;
    $('playerGroupLabel').textContent = byPeriod ? tr('时期', 'Period') : tr('作曲家', 'Composer');
    const choices = byPeriod ? periodLabels.map((_, index) => [String(index), periodName(index)]) : composers.map(name => [name, name]);
    const all = byPeriod ? tr('所有时期', 'All periods') : tr('所有作曲家', 'All composers');
    group.replaceChildren(new Option(all, ''), ...choices.map(([id, name]) => new Option(name, id)));
    group.value = value;
  }

  function renderRowPlayback() {
    const playing = !audio.paused && !audio.ended;
    for (const { track, row, action, symbol } of trackRows.values()) {
      const active = track === current;
      row.classList.toggle('is-current', active);
      if (active) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
      if (track.recording) {
        const pausable = active && playing;
        setIcon(symbol, pausable ? 'pause' : 'play', 17);
        label(action, `${pausable ? tr('暂停', 'Pause') : tr('播放', 'Play')} ${track.title}`);
      }
    }
  }

  function renderTime() {
    const durationKnown = loaded === current && Number.isFinite(audio.duration) && audio.duration > 0;
    const duration = durationKnown ? audio.duration : activeRecording()?.duration || 0;
    const elapsed = durationKnown ? audio.currentTime : 0;
    seek.disabled = !durationKnown;
    seek.max = String(duration || 1);
    seek.value = String(elapsed);
    seek.setAttribute('aria-valuetext', `${formatTime(elapsed)} / ${formatTime(duration)}`);
    $('playerElapsed').textContent = formatTime(elapsed);
    $('playerDuration').textContent = formatTime(duration);
  }

  function renderPlayback() {
    const playing = !audio.paused && !audio.ended;
    audio.loop = repeat === 'one' && !current?.recording.sequence;
    const position = queue.indexOf(current);
    $('playerVisual').classList.toggle('is-playing', playing);
    const status = playing ? tr('正在播放', 'Now playing') : tr('待播放', 'Ready to play');
    $('playerNowState').textContent = status;
    setIcon(playButton, playing ? 'pause' : 'play', 23);
    label(playButton, playing ? tr('暂停', 'Pause') : tr('播放', 'Play'));
    playButton.disabled = !current;
    $('playerPrevious').disabled = !current || (position <= 0 && repeat !== 'all' && loaded !== current);
    $('playerNext').disabled = !current || (position >= queue.length - 1 && repeat !== 'all');
    $('playerShuffle').disabled = queue.length < 2;
    $('playerShuffle').setAttribute('aria-pressed', String(shuffled));
    $('playerRepeat').disabled = !current;
    $('playerRepeat').setAttribute('aria-pressed', String(repeat !== 'off'));
    setIcon($('playerRepeat'), repeat === 'one' ? 'repeatOne' : 'repeat', 18);
    label($('playerRepeat'), {
      off: tr('循环关闭', 'Repeat off'),
      all: tr('列表循环', 'Repeat queue'),
      one: tr('单曲循环', 'Repeat one'),
    }[repeat]);
    $('playerShowQueue').disabled = !queue.length;
    renderRowPlayback();
  }

  function renderCurrent() {
    const title = current?.title || tr('暂无站内录音', 'No on-site recordings yet');
    $('playerNowTitle').textContent = title;
    $('playerBarTitle').textContent = title;
    $('playerNowByline').textContent = current ? `${current.composer} · ${periodName(current.periodIndex)}` : '';
    const sequence = current?.recording.sequence;
    const part = sequence?.[partIndex];
    $('playerBarByline').textContent = [current?.composer, part?.name].filter(Boolean).join(' · ');
    $('playerSequence').hidden = !sequence;
    if (sequence) {
      const partSelect = $('playerPart');
      partSelect.replaceChildren(...sequence.map((item, index) => new Option(`${item.name} · ${formatTime(item.duration)}`, index)));
      partSelect.value = String(partIndex);
      $('playerPlayComplete').hidden = !current.recording.selectedPart;
    }
    $('playerCredit').textContent = current?.recording.credit || '';
    $('playerCredit').hidden = !current?.recording.credit;
    const favorite = $('playerFavorite');
    favorite.hidden = !current;
    favorite.dataset.playerFavorite = current?.id || '';
    $('playerDiscuss').hidden = !current;
    $('playerBackground').hidden = !current;
    $('playerReport').hidden = !current;
    $('playerAlbum').hidden = !recordingAlbums[current?.recording.album];
    updateFavorites();
    renderTime();
    renderPlayback();
    if (queueDialog.open) renderQueue();
  }

  function clearPlaybackError() {
    $('playerError').hidden = true;
  }

  function showPlaybackError() {
    const message = tr('音频播放失败。请检查网络后重试。', 'Audio could not play. Check your connection and try again.');
    $('playerError').textContent = message;
    $('playerError').hidden = false;
    $('playerBarByline').textContent = tr('播放失败', 'Playback failed');
    renderPlayback();
  }

  async function playTrack(track, index = loaded === track && !audio.ended ? partIndex : track?.recording.selectedPart ?? 0) {
    if (!track) return;
    const request = ++playRequest;
    current = track;
    if (loaded !== track || partIndex !== index || audio.error) {
      loaded = track;
      partIndex = index;
      audio.src = activeRecording().src;
    }
    clearPlaybackError();
    renderCurrent();
    visualizer.prepare();
    try {
      await audio.play();
    } catch (error) {
      if (request === playRequest && error.name !== 'AbortError') showPlaybackError();
    }
  }

  function startTrack(track, index = track.recording.selectedPart ?? 0) {
    loopFrom = index;
    if (loaded === track && index === partIndex && Number.isFinite(audio.duration)) audio.currentTime = 0;
    playTrack(track, index);
  }

  function pause() {
    playRequest++;
    audio.pause();
  }

  function beginQueue(items, first) {
    if (!items.length) return;
    queueSource = items;
    queue = shuffled ? shuffleTracks(items.filter(track => track !== first)) : [...items];
    if (shuffled && first) queue.unshift(first);
    startTrack(first || queue[0]);
  }

  function advance(direction) {
    const position = queue.indexOf(current);
    if (queue[position + direction]) {
      startTrack(queue[position + direction]);
      return;
    }
    if (repeat !== 'all' || !queue.length) return;
    if (direction > 0 && shuffled && queue.length > 1) {
      queue = shuffleTracks(queueSource);
      if (queue[0] === current) [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    const next = direction > 0 ? queue[0] : queue.at(-1);
    startTrack(next);
  }

  function fillQueueList(list, items, selectTrack) {
    list.replaceChildren();
    for (const track of items) {
      const entry = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      if (track === current) button.setAttribute('aria-current', 'true');
      button.append(icon(track === current ? 'disc' : 'play', 16), document.createTextNode(track.title));
      button.addEventListener('click', () => selectTrack(track));
      entry.append(button);
      list.append(entry);
    }
  }

  function renderQueue() {
    $('playerQueueCount').textContent = tr(`第 ${queue.indexOf(current) + 1} 首 / 共 ${queue.length} 首`, `Track ${queue.indexOf(current) + 1} of ${queue.length}`);
    fillQueueList($('playerQueueList'), queue, track => {
      queueDialog.close();
      startTrack(track);
    });
  }

  function openAlbum() {
    const albumKey = current?.recording.album;
    const album = recordingAlbums[albumKey];
    if (!album) return;
    const artwork = $('playerAlbumArtwork');
    artwork.hidden = !album.artwork;
    if (album.artwork) {
      artwork.src = album.artwork;
      artwork.alt = tr(`${album.title} 封面`, `Cover of ${album.title}`);
    } else artwork.removeAttribute('src');
    $('playerAlbumTitle').textContent = album.title;
    $('playerAlbumCredit').textContent = [album.artist, album.year].filter(Boolean).join(' · ');
    const items = onSite.filter(track => track.recording.album === albumKey);
    fillQueueList($('playerAlbumTracks'), items, track => {
      albumDialog.close();
      beginQueue(items, track);
    });
    albumDialog.showModal();
  }

  function renderVolume() {
    const muted = audio.muted || !audio.volume;
    $('playerVolume').value = String(muted ? 0 : audio.volume);
    $('playerMute').setAttribute('aria-pressed', String(muted));
    setIcon($('playerMute'), muted ? 'mute' : 'volume', 18);
    label($('playerMute'), muted ? tr('取消静音', 'Unmute') : tr('静音', 'Mute'));
  }

  function renderLanguage() {
    document.title = `QE Listening List · ${tr('聆听室', 'Listening room')}`;
    const works = new Set(tracks.map(track => track.id)).size;
    $('playerLibraryCount').textContent = tr(`${works} 首作品，${data.length} 个时期`, `${works} works across ${data.length} periods`);
    search.setAttribute('aria-label', tr('搜索曲目', 'Search works'));
    label($('playerPrevious'), tr('上一首', 'Previous track'));
    label($('playerNext'), tr('下一首', 'Next track'));
    label($('playerShuffle'), tr('随机播放', 'Shuffle'));
    seek.setAttribute('aria-label', tr('播放进度', 'Playback position'));
    label($('playerShowQueue'), tr('播放队列', 'Playback queue'));
    $('playerCloseQueue').setAttribute('aria-label', tr('关闭队列', 'Close queue'));
    $('playerCloseAlbum').setAttribute('aria-label', tr('关闭专辑', 'Close album'));
    $('playerVolume').setAttribute('aria-label', tr('音量', 'Volume'));
    configureGroupFilter(group.value);
    renderCatalog();
    renderCurrent();
    renderVolume();
  }

  for (const button of browseButtons) button.addEventListener('click', () => {
    view = button.dataset.browse;
    for (const tab of browseButtons) tab.setAttribute('aria-pressed', String(tab === button));
    configureGroupFilter();
    resetGroupsAndRender();
  });
  search.addEventListener('input', resetGroupsAndRender);
  group.addEventListener('change', resetGroupsAndRender);
  audioOnly.addEventListener('change', resetGroupsAndRender);
  playSelection.addEventListener('click', () => beginQueue(selection));
  playButton.addEventListener('click', () => {
    if (!current) return;
    if (audio.ended) startTrack(current);
    else if (audio.paused) playTrack(current);
    else pause();
  });
  $('playerPrevious').addEventListener('click', () => {
    if (loaded === current && (audio.currentTime > 3 || (queue[0] === current && repeat !== 'all'))) audio.currentTime = 0;
    else advance(-1);
  });
  $('playerNext').addEventListener('click', () => advance(1));
  $('playerShuffle').addEventListener('click', () => {
    shuffled = !shuffled;
    queue = shuffled ? [current, ...shuffleTracks(queueSource.filter(track => track !== current))] : [...queueSource];
    renderPlayback();
    if (queueDialog.open) renderQueue();
  });
  $('playerRepeat').addEventListener('click', () => {
    repeat = { off: 'all', all: 'one', one: 'off' }[repeat];
    renderPlayback();
  });
  seek.addEventListener('input', () => { if (!seek.disabled) audio.currentTime = Number(seek.value); });
  $('playerVolume').addEventListener('input', event => {
    audio.volume = Number(event.target.value);
    audio.muted = false;
  });
  $('playerMute').addEventListener('click', () => {
    if (audio.volume === 0) {
      audio.volume = 1;
      audio.muted = false;
    } else audio.muted = !audio.muted;
  });
  $('playerShowQueue').addEventListener('click', () => { renderQueue(); queueDialog.showModal(); });
  $('playerCloseQueue').addEventListener('click', () => queueDialog.close());
  $('playerAlbum').addEventListener('click', openAlbum);
  $('playerCloseAlbum').addEventListener('click', () => albumDialog.close());
  $('playerAlbumArtwork').addEventListener('error', event => { event.currentTarget.hidden = true; });
  $('playerFavorite').addEventListener('click', () => { if (current) favorites.toggle(current.id); });
  $('playerDiscuss').addEventListener('click', () => { if (current) openComments(current.id); });
  $('playerBackground').addEventListener('click', () => { if (current) workDetails.openBackground(current.id); });
  $('playerReport').addEventListener('click', () => { if (current) workDetails.openReport(current.id); });
  $('playerPart').addEventListener('change', event => {
    const index = Number(event.target.value);
    if (current?.recording.sequence?.[index]) playTrack(current, index);
  });
  $('playerPlayComplete').addEventListener('click', () => { if (current?.recording.sequence) startTrack(current, 0); });
  audio.addEventListener('ended', () => {
    renderPlayback();
    if (current?.recording.sequence?.[partIndex + 1]) playTrack(current, partIndex + 1);
    else if (current?.recording.sequence && repeat === 'one') startTrack(current, loopFrom);
    else if (!audio.loop) advance(1);
  });
  for (const event of ['play', 'pause', 'playing']) audio.addEventListener(event, renderPlayback);
  for (const event of ['loadedmetadata', 'timeupdate', 'durationchange']) audio.addEventListener(event, renderTime);
  audio.addEventListener('error', () => { if (audio.error) showPlaybackError(); });
  audio.addEventListener('volumechange', renderVolume);
  favorites.subscribe(() => {
    if (view === 'favorites' && favoriteViewSignature !== favoriteSignature()) renderCatalog();
    else updateFavorites();
  });

  new MutationObserver(renderLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  root.hidden = false;
  renderLanguage();
}
