import { icon } from './icons.js';
import { createMediaControls } from './media.js';

const $ = id => document.getElementById(id);
const normalise = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();

export function buildLibrary({data, app, stateButtons, noteControls, isAdmin, changeState, updateNote, makeButton, openComments}) {
  let selected = 0;
  let beforeSearch = 0;
  const sections = [];
  const navigation = [];
  const search = $('trackSearch');
  for (const [index, [period, composers]] of data.entries()) {
    const [english, chinese] = splitPeriod(period);
    const count = composers.reduce((total, [,tracks]) => total + tracks.length, 0);
    const nav = document.createElement('button');
    nav.type = 'button';
    nav.className = 'period-link';
    nav.setAttribute('aria-controls', `period-${index}`);
    nav.setAttribute('aria-label', `${period}，${count} 首作品`);
    const order = document.createElement('span'); order.className = 'period-order'; order.textContent = String(index + 1).padStart(2,'0');
    const label = document.createElement('span'); label.className = 'period-link-name'; label.append(document.createTextNode(english));
    const small = document.createElement('small'); small.textContent = chinese; label.append(small);
    const total = document.createElement('span'); total.className = 'nav-count'; total.textContent = count;
    nav.append(order, label, total);
    nav.addEventListener('click', () => selectPeriod(index));
    $('periodNav').append(nav);
    navigation.push(nav);

    const section = document.createElement('section');
    section.className = 'period';
    section.id = `period-${index}`;
    section.setAttribute('aria-label', period);
    const periodLabel = document.createElement('h3');
    periodLabel.className = 'period-label'; periodLabel.textContent = period;
    section.append(periodLabel);
    const groups = [];
    for (const [composer, tracks] of composers) {
      const group = document.createElement('details');
      group.className = 'composer';
      group.open = true;
      const summary = document.createElement('summary');
      const chevron = icon('chevron',14); chevron.classList.add('composer-chevron');
    const name = document.createElement('h3'); name.textContent = composer;
      const total = document.createElement('span'); total.className = 'count'; total.textContent = `${tracks.length} 首`;
      summary.append(chevron,name,total); group.append(summary);
      const rows = [];
      for (const [id, fullText] of tracks) {
        const row = document.createElement('article');
        row.className = 'track'; row.id = `track-${id}`;
        const number = document.createElement('span'); number.className = 'track-index'; number.textContent = String(id).padStart(2,'0');
        const title = document.createElement('div'); title.className = 'track-text';
        const split = fullText.indexOf(' — ');
        const titleOnly = split >= 0 ? fullText.slice(split + 3) : fullText;
        const movement = titleOnly.indexOf(': ');
        const heading = document.createElement('h4'); heading.className = 'work-name'; heading.textContent = movement >= 0 ? titleOnly.slice(0,movement) : titleOnly;
        title.append(heading);
        if (movement >= 0) { const context = document.createElement('p'); context.className = 'work-context'; context.textContent = titleOnly.slice(movement+2); title.append(context); }
        row.append(number,title);
        const media = createMediaControls(id,fullText);
        if (media) row.append(media);
        const footer = document.createElement('div'); footer.className = 'track-footer';
        const actions = document.createElement('div'); actions.className = 'actions';
        const discuss = document.createElement('button'); discuss.type = 'button'; discuss.className = 'copy comment-button';
        discuss.setAttribute('aria-haspopup','dialog'); discuss.setAttribute('aria-label', `打开第 ${id} 首的评论窗口`);
        discuss.append(icon('comment',13),document.createTextNode('讨论')); discuss.addEventListener('click',()=>openComments(id));
        const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'copy note-toggle';
        toggle.setAttribute('aria-controls',`note-${id}`); toggle.setAttribute('aria-expanded','false');
        const panel = document.createElement('div'); panel.className = 'note-panel'; panel.id = `note-${id}`; panel.hidden = true;
        const header = document.createElement('div'); header.className = 'note-header'; header.textContent = `第 ${id} 首 · 共享听辨备注`;
        const input = document.createElement('textarea'); input.className = 'note-input'; input.rows = 3; input.maxLength = 3000;
        input.placeholder = '录音版本、听辨特征、需要核对的细节…'; input.setAttribute('aria-label',`第 ${id} 首曲目备注`);
        input.addEventListener('input',()=>updateNote(id,input.value));
        const hint = document.createElement('div'); hint.className = 'note-hint'; hint.textContent = '共享备注由管理员维护。分享个人发现，请打开讨论。';
        panel.append(header,input,hint);
        toggle.addEventListener('click',()=>{panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded',String(!panel.hidden)); if (!panel.hidden && isAdmin()) input.focus();});
        noteControls.set(id,{button:toggle,input});
        actions.append(discuss,toggle,makeButton('复制标题',titleOnly));
        const markWrapper = document.createElement('div'); markWrapper.className = 'state-wrapper';
        const mark = document.createElement('button'); mark.type = 'button'; mark.className = 'state-btn'; mark.setAttribute('role','checkbox');
        mark.addEventListener('click',()=>changeState(id)); stateButtons.set(id,mark);
        const status = document.createElement('span'); status.className = 'track-state-label'; status.id = `state-label-${id}`; status.textContent = '未标记';
        markWrapper.append(mark,status); footer.append(actions,markWrapper); row.append(footer,panel); group.append(row);
        rows.push({row,id,text:normalise(`${period} ${composer} ${fullText}`)});
      }
      section.append(group); groups.push({group,rows});
    }
    sections.push({section,periodLabel,groups}); app.append(section);
  }
  const all = document.createElement('button'); all.type = 'button'; all.className = 'period-link all-periods';
  all.append(icon('book',15),document.createTextNode('全部作品'));
  all.addEventListener('click',()=>selectPeriod(-1)); $('periodNav').append(all);

  function selectPeriod(index) {
    selected=index; beforeSearch=index; search.value=''; delete search.dataset.searching; updateView();
  }

  function updateView() {
    const query = normalise(search.value.trim());
    const global = Boolean(query) || selected === -1;
    let visible = 0;
    for (const [index,{section,periodLabel,groups}] of sections.entries()) {
      let periodVisible = 0;
      periodLabel.hidden = !global;
      for (const {group,rows} of groups) {
        let groupVisible = 0;
        for (const {row,id,text} of rows) {
          const matches = !query || (/^\d+$/.test(query) ? id === Number(query) : text.includes(query));
          row.hidden = !matches;
          if (matches) groupVisible++;
        }
        group.hidden = !groupVisible;
        if (query && groupVisible) group.open = true;
        periodVisible += groupVisible;
      }
      section.hidden = (!global && selected !== index) || !periodVisible;
      if (!section.hidden) visible += periodVisible;
    }
    navigation.forEach((button,index)=>{if (!global && index===selected) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current');});
    if (!query && selected===-1) all.setAttribute('aria-current','true'); else all.removeAttribute('aria-current');
    $('periodTitle').replaceChildren();
    if (query) {
      $('periodTitle').textContent = 'Search results'; $('breadcrumbPeriod').textContent = '搜索结果'; $('periodIndex').textContent = '全部时期';
    } else if (selected===-1) {
      $('periodTitle').textContent = 'The complete collection'; $('breadcrumbPeriod').textContent = '全部作品'; $('periodIndex').textContent = '06 个时期';
    } else {
      const [english,chinese] = splitPeriod(data[selected][0]);
      const small = document.createElement('span'); small.textContent = chinese;
      $('periodTitle').append(document.createTextNode(english),small); $('breadcrumbPeriod').textContent = english; $('periodIndex').textContent = `${String(selected+1).padStart(2,'0')} / 06`;
    }
    $('visibleCount').textContent = `${visible} 首作品`;
    $('emptySearch').hidden = visible > 0;
    $('pilotNote').hidden = query || selected !== 0;
    document.querySelectorAll('audio').forEach(audio=>{if (audio.closest('.period').hidden || audio.closest('.track').hidden || audio.closest('.composer').hidden) audio.pause();});
  }
  search.addEventListener('input',()=>{if (search.value.trim() && !search.dataset.searching){beforeSearch=selected;search.dataset.searching='true';} else if (!search.value.trim()){selected=beforeSearch;delete search.dataset.searching;} updateView();});
  $('clearSearch').addEventListener('click',()=>{search.value='';delete search.dataset.searching;selected=beforeSearch;updateView();search.focus();});
  document.addEventListener('keydown',e=>{if (e.key==='/' && !document.querySelector('dialog[open]') && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();search.focus();}});
  updateView();
}

function splitPeriod(period) {
  const chinese = period.search(/[\u3400-\u9fff]/);
  return [period.slice(0,chinese).trim(),period.slice(chinese)];
}
