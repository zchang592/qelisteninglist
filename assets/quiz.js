import { data } from './data.js';
import { localRecordings, playbackUnitsForWork } from './local-recordings.js?v=1.6.6';
import { icon, mountIcons } from './icons.js?v=4';
import { gradeAnswer, normalizeAnswer } from './quiz-scoring.js?v=1.6.0';
import { workBackgrounds } from './work-backgrounds.js?v=1.6.4';

const $ = id => document.getElementById(id);
const setup = $('quizSetup');
const setupForm = $('quizSetupForm');
const round = $('quizRound');
const answerForm = $('quizAnswerForm');
const options = $('quizOptions');
const textAnswer = $('quizText');
const audio = $('quizAudio');
const anonymous = new Set(['Gregorian chant', 'Medieval 6-part polyphony', '16th century English folksong']);
const anonymousAnswers = ['Anonymous', 'Traditional', 'Unknown', '佚名', '无名氏', '不详'];
const composerAliases = {
  'Gregorian chant': ['Gregorian', '格里高利圣咏', '格里高利圣歌'],
  'Medieval 6-part polyphony': ['English round', '中世纪六声部复调'],
  'Guillaume de Machaut': ['Machaut', '纪尧姆·德·马肖', '马肖', '马绍'],
  'Johann Sebastian Bach': ['J. S. Bach', '约翰·塞巴斯蒂安·巴赫', '巴赫'],
  'C. P. E. Bach': ['Carl Philipp Emanuel Bach', '卡尔·菲利普·埃马努埃尔·巴赫'],
  'J. C. Bach': ['Johann Christian Bach', '约翰·克里斯蒂安·巴赫'],
  'Mozart': ['Wolfgang Amadeus Mozart', '莫扎特'],
  'Beethoven': ['Ludwig van Beethoven', '贝多芬'],
  'Haydn': ['Joseph Haydn', '海顿'],
  'Antonio Vivaldi': ['Vivaldi', '维瓦尔第'],
  'Georg Frideric Handel': ['George Frideric Handel', 'Handel', 'Händel', '亨德尔'],
  'François Couperin': ['Couperin', '库普兰'],
};

function readPreference(key, fallback) {
  try { return localStorage.getItem(key) || fallback; }
  catch { return fallback; }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, value); } catch { /* The current page still uses the preference. */ }
}

let language = readPreference('qe-language', 'zh') === 'en' ? 'en' : 'zh';
let theme = readPreference('qe-theme', 'light') === 'dark' ? 'dark' : 'light';
const tr = (zh, en) => language === 'en' ? en : zh;
const periods = data.map(([name]) => {
  const index = name.search(/[\u3400-\u9fff]/);
  return { en: name.slice(0, index).trim(), zh: name.slice(index) };
});
const withoutParentheses = text => text.replace(/\s*\([^)]*\)/g, '').trim();
const creatorKey = name => anonymous.has(name) ? 'anonymous' : name;
const catalogue = data.flatMap(([, composers], period) => composers.flatMap(([composer, works]) => works.map(([id, fullText]) => {
  const recording = localRecordings[id];
  const work = fullText.split(' — ').slice(1).join(' — ') || fullText;
  const title = recording?.quizTitle || work;
  const [parent, ...section] = title.split(': ');
  return {
    id, work, title, period, composer, parent, section: section.join(': '), recording,
    titles: [title, withoutParentheses(title), ...(recording?.titleAliases || [])],
  };
})));
const pool = catalogue.flatMap(track => playbackUnitsForWork(track.id).map(unit => ({
  ...track, recording: unit.selectedPart === undefined ? unit : unit.sequence[unit.selectedPart],
})));
const creators = [...new Set(catalogue.map(track => track.composer))];
const scopePeriods = [];
let current;
let mode = 'period';
let difficulty = 'easy';
let questionNumber = 0;
let activePool = [];
let remaining = [];
let choices = [];
let selected = '';
let result;
let partIndex = 0;

function shuffled(items) {
  const order = [...items];
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  return order;
}

function composerName(name) {
  return creatorKey(name) === 'anonymous' ? tr('佚名', 'Anonymous') : name;
}

function composerAnswers(track) {
  const name = track.composer;
  const aliases = [...(composerAliases[name] || []), ...(track.recording?.composerAliases || [])];
  if (anonymous.has(name)) return [...anonymousAnswers, name, ...aliases];
  const surname = name.split(' ').at(-1);
  if (creators.filter(creator => creator.split(' ').at(-1) === surname).length === 1) aliases.push(surname);
  return [name, ...aliases];
}

function fourChoices(answer, preferred, others) {
  const unique = new Map([[answer.key, answer]]);
  for (const candidate of [...shuffled(preferred), ...shuffled(others)]) {
    if (unique.size === 4) break;
    if (!unique.has(candidate.key)) unique.set(candidate.key, candidate);
  }
  return shuffled(unique.values());
}

function makeChoices() {
  if (mode === 'period') return periods.map((_, index) => ({ key: index, value: index }));
  const samePeriod = catalogue.filter(track => track.period === current.period);
  if (mode === 'composer') {
    const choice = track => ({ key: creatorKey(track.composer), value: track.composer });
    return fourChoices(choice(current), samePeriod.map(choice), catalogue.map(choice));
  }
  const choice = track => ({ key: normalizeAnswer(track.title), value: track.title });
  return fourChoices(choice(current), samePeriod.map(choice), catalogue.map(choice));
}

function choiceLabel(choice) {
  if (mode === 'period') return periods[choice.value][language];
  if (mode === 'composer') return composerName(choice.value);
  return choice.value;
}

function correctChoice() {
  if (mode === 'period') return current.period;
  if (mode === 'composer') return creatorKey(current.composer);
  return normalizeAnswer(current.title);
}

function checkText() {
  if (mode === 'composer') {
    const others = catalogue.filter(track => creatorKey(track.composer) !== creatorKey(current.composer));
    return gradeAnswer(textAnswer.value, { answers: composerAnswers(current), otherAnswers: others.flatMap(composerAnswers) });
  }
  const others = catalogue.filter(track => track.id !== current.id);
  const partial = [];
  if (current.section && others.some(track => track.parent === current.parent)) {
    partial.push(current.parent, withoutParentheses(current.parent));
    for (const match of current.parent.matchAll(/\(([^)]+)\)/g)) partial.push(match[1]);
  }
  if (current.section && others.some(track => normalizeAnswer(track.section) === normalizeAnswer(current.section))) partial.push(current.section);
  return gradeAnswer(textAnswer.value, { answers: current.titles, partial, otherAnswers: others.flatMap(track => track.titles) });
}

function scopeChoice(name, count) {
  const label = document.createElement('label');
  label.className = 'quiz-scope-choice';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = true;
  const caption = document.createElement('span');
  caption.className = 'quiz-scope-name';
  caption.textContent = name;
  const availability = document.createElement('span');
  availability.className = 'quiz-scope-count';
  availability.setAttribute('aria-hidden', 'true');
  label.append(input, caption, availability);
  return { label, input, caption, availability, count };
}

function setScopeOpen(scope, open) {
  scope.list.hidden = !open;
  scope.toggle.setAttribute('aria-expanded', String(open));
  const name = periods[scope.period][language];
  scope.toggle.setAttribute('aria-label', open ? tr(`折叠${name}作曲家`, `Collapse ${name} composers`) : tr(`展开${name}作曲家`, `Expand ${name} composers`));
}

function buildScope() {
  for (const [period, [, composers]] of data.entries()) {
    const card = document.createElement('div');
    card.className = 'quiz-scope-period';
    card.dataset.scopePeriod = period;
    const head = document.createElement('div');
    head.className = 'quiz-scope-head';
    const list = document.createElement('div');
    list.className = 'quiz-scope-composers';
    list.id = `quizScopeComposers-${period}`;
    const choices = new Map();
    let count = 0;
    for (const [composer, works] of composers) {
      const choice = scopeChoice(composer, works.reduce((total, [id]) => total + playbackUnitsForWork(id).length, 0));
      count += choice.count;
      choices.set(composer, choice);
      list.append(choice.label);
    }
    const parent = scopeChoice(periods[period][language], count);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'quiz-scope-toggle';
    toggle.setAttribute('aria-controls', list.id);
    toggle.append(icon('chevron', 16));
    const scope = { period, parent, choices, list, toggle };
    parent.input.addEventListener('change', () => {
      for (const choice of choices.values()) choice.input.checked = parent.input.checked;
      if (parent.input.checked) setScopeOpen(scope, true);
    });
    toggle.addEventListener('click', () => setScopeOpen(scope, list.hidden));
    setScopeOpen(scope, period === 0);
    head.append(parent.label, toggle);
    card.append(head, list);
    $('quizScopeList').append(card);
    scopePeriods.push(scope);
  }
}

function selectedRecordings() {
  return pool.filter(track => scopePeriods[track.period].choices.get(track.composer).input.checked);
}

function renderScope() {
  for (const scope of scopePeriods) {
    const { parent, choices } = scope;
    const checked = [...choices.values()].filter(choice => choice.input.checked).length;
    parent.input.checked = choices.size > 0 && checked === choices.size;
    parent.input.indeterminate = checked > 0 && checked < choices.size;
    parent.caption.textContent = periods[scope.period][language];
    for (const { availability, count } of [parent, ...choices.values()]) {
      availability.textContent = count ? tr(`${count} 段录音`, `${count} ${count === 1 ? 'recording' : 'recordings'}`) : tr('暂无录音', 'No audio');
    }
    setScopeOpen(scope, !scope.list.hidden);
  }
  const count = selectedRecordings().length;
  const status = count ? tr(`所选范围有 ${count} 段可抽取的录音`, `${count} ${count === 1 ? 'recording' : 'recordings'} in scope`) : tr('请勾选包含站内录音的范围。', 'Select a scope that contains on-site recordings.');
  if ($('quizScopeStatus').textContent !== status) $('quizScopeStatus').textContent = status;
  $('quizStart').disabled = !count;
}

function setScopeSelection(checked) {
  for (const { choices } of scopePeriods) {
    for (const { input } of choices.values()) input.checked = checked;
  }
  renderScope();
}

function renderSettings() {
  const selected = new FormData(setupForm);
  $('quizDifficulty').hidden = selected.get('mode') === 'period';
  $('quizThresholds').hidden = $('quizDifficulty').hidden || selected.get('difficulty') !== 'hard';
  renderScope();
  $('quizPoolCount').textContent = pool.length
    ? tr(`题库有 ${pool.length} 段站内录音，新增录音会自动加入。`, `${pool.length} on-site recordings are available. New recordings are added to the practice pool as they arrive.`)
    : tr('题库会在站内录音加入后开放。', 'Practice opens when recordings are added.');
}

function renderFeedback() {
  const feedback = $('quizFeedback');
  feedback.hidden = !result;
  if (!result) return;
  feedback.dataset.verdict = result.verdict;
  $('quizVerdict').textContent = {
    correct: tr('正确', 'Correct'), inexact: tr('不够准确', 'Close'), incorrect: tr('错误', 'Incorrect'),
  }[result.verdict];
  $('quizSimilarity').hidden = result.percent === undefined;
  $('quizSimilarity').textContent = result.percent === undefined ? '' : tr(`相似度 ${result.percent}%`, `${result.percent}% similarity`);
  $('quizReason').hidden = !result.reason;
  $('quizReason').textContent = {
    selection: tr('请补充具体乐章或选段。', 'Include the movement or selection.'),
    different: tr('输入内容对应另一首作品或另一位作曲家。', 'That answer identifies another work or composer.'),
    number: tr('作品或乐章编号不符。', 'The catalogue or movement number differs.'),
  }[result.reason] || '';
  const solution = mode === 'period' ? periods[current.period][language] : mode === 'composer' ? composerName(current.composer) : current.title;
  $('quizSolution').textContent = tr(`正确答案 · ${solution}`, `Correct answer · ${solution}`);
  const work = mode === 'title' ? '' : current.work;
  $('quizWork').textContent = [work, current.recording.name].filter(Boolean).join(' · ');
  $('quizWork').hidden = !$('quizWork').textContent;
  const sequence = current.recording.sequence;
  $('quizPartControl').hidden = !sequence;
  if (sequence) {
    $('quizPart').replaceChildren(...sequence.map((part, index) => new Option(part.name, index)));
    $('quizPart').value = String(partIndex);
  }
  const background = workBackgrounds[current.id][language];
  $('quizAnswerComposer').textContent = background.composer;
  $('quizAnswerPeriod').textContent = periods[current.period][language];
  $('quizAnswerYear').textContent = background.year;
  $('quizWorkBackground').href = `./index.html?track=${current.id}&panel=background`;
  $('quizWorkReport').href = `./index.html?track=${current.id}&panel=report`;
}

function renderQuestion() {
  $('quizQuestionNumber').textContent = tr(`第 ${questionNumber} 题`, `Question ${questionNumber}`);
  $('quizPrompt').textContent = {
    period: tr('这段音乐属于哪个时期？', 'Which period is this music from?'),
    composer: tr('这段音乐的作曲家是谁？', 'Who composed this music?'),
    title: tr('你听到的是哪首作品？', 'Which work are you hearing?'),
  }[mode];
  const freeText = mode !== 'period' && difficulty === 'hard';
  textAnswer.hidden = !freeText;
  textAnswer.required = freeText && !result;
  textAnswer.disabled = !freeText || !!result;
  textAnswer.placeholder = tr('在这里输入答案', 'Type your answer');
  options.replaceChildren();
  for (const [index, choice] of choices.entries()) {
    const option = document.createElement('label');
    option.className = 'quiz-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = String(index);
    input.required = !result;
    input.checked = selected === input.value;
    input.disabled = !!result;
    if (result) {
      if (choice.key === correctChoice()) option.dataset.correct = 'true';
      else if (input.checked) option.dataset.incorrect = 'true';
    }
    const caption = document.createElement('span');
    caption.textContent = choiceLabel(choice);
    option.append(input, caption);
    options.append(option);
  }
  $('quizSubmit').hidden = !!result;
  renderFeedback();
}

function setPart(index, play = false) {
  partIndex = index;
  const recording = current.recording.sequence?.[index] ?? current.recording;
  $('quizAudioError').hidden = true;
  audio.src = recording.src;
  if (result && current.recording.sequence) $('quizPart').value = String(index);
  if (play) audio.play().catch(() => { if (audio.error) $('quizAudioError').hidden = false; });
}

function nextQuestion() {
  if (!remaining.length) {
    remaining = shuffled(activePool);
    if (remaining.length > 1 && remaining[0] === current) [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
  }
  current = remaining.shift();
  if (!current) return;
  questionNumber++;
  choices = difficulty === 'hard' ? [] : makeChoices();
  selected = '';
  result = undefined;
  textAnswer.value = '';
  textAnswer.setCustomValidity('');
  $('quizSolution').textContent = '';
  $('quizWork').textContent = '';
  for (const id of ['quizAnswerComposer', 'quizAnswerPeriod', 'quizAnswerYear']) $(id).textContent = '';
  for (const id of ['quizWorkBackground', 'quizWorkReport']) $(id).removeAttribute('href');
  audio.pause();
  setPart(0);
  $('quizPart').replaceChildren();
  $('quizPartControl').hidden = true;
  if ('mediaSession' in navigator && 'MediaMetadata' in window) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: tr('盲听片段', 'Blind listening excerpt'), artist: 'QE Listening List' });
  }
  renderQuestion();
  $('quizPrompt').focus();
}

function applyLanguage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.title = `QE Listening List · ${tr('盲听测试', 'Blind listening')}`;
  $('quizLanguage').textContent = tr('EN', '中');
  $('quizLanguage').setAttribute('aria-label', tr('Switch to English', '切换至中文'));
  audio.setAttribute('aria-label', tr('盲听片段', 'Blind listening excerpt'));
  round.setAttribute('aria-label', tr('盲听题目', 'Blind listening question'));
  for (const element of document.querySelectorAll('[data-zh]')) element.textContent = element.dataset[language];
  renderSettings();
  if (!round.hidden) renderQuestion();
  $('quizTheme').setAttribute('aria-label', tr('切换深浅色模式', 'Switch color theme'));
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $('quizTheme').textContent = theme === 'dark' ? '☀' : '☾';
}

setupForm.addEventListener('change', renderSettings);
$('quizScopeAll').addEventListener('click', () => setScopeSelection(true));
$('quizScopeClear').addEventListener('click', () => setScopeSelection(false));
setupForm.addEventListener('submit', event => {
  event.preventDefault();
  activePool = selectedRecordings();
  if (!activePool.length) return;
  const values = new FormData(setupForm);
  mode = values.get('mode');
  difficulty = mode === 'period' ? 'easy' : values.get('difficulty');
  questionNumber = 0;
  remaining = [];
  current = undefined;
  setup.hidden = true;
  round.hidden = false;
  nextQuestion();
});

answerForm.addEventListener('change', event => {
  if (event.target.name === 'answer') selected = event.target.value;
});
textAnswer.addEventListener('input', () => textAnswer.setCustomValidity(''));
answerForm.addEventListener('submit', event => {
  event.preventDefault();
  if (result) return;
  if (difficulty === 'hard') {
    if (!normalizeAnswer(textAnswer.value)) {
      textAnswer.setCustomValidity(tr('请输入答案。', 'Enter an answer.'));
      textAnswer.reportValidity();
      return;
    }
    result = checkText();
  } else {
    const value = new FormData(answerForm).get('answer');
    if (value === null) return;
    const choice = choices[Number(value)];
    result = { verdict: choice?.key === correctChoice() ? 'correct' : 'incorrect' };
  }
  renderQuestion();
  $('quizFeedback').focus();
});

$('quizNext').addEventListener('click', nextQuestion);
$('quizReplace').addEventListener('click', nextQuestion);
$('quizSettings').addEventListener('click', () => {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
  round.hidden = true;
  setup.hidden = false;
  setupForm.elements.namedItem('mode')[0].focus();
});
audio.addEventListener('error', () => { if (!round.hidden && audio.error) $('quizAudioError').hidden = false; });
audio.addEventListener('ended', () => {
  if (!round.hidden && current?.recording.sequence?.[partIndex + 1]) setPart(partIndex + 1, true);
});
$('quizPart').addEventListener('change', event => {
  const index = Number(event.target.value);
  if (result && current?.recording.sequence?.[index]) setPart(index, true);
});
$('quizLanguage').addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  savePreference('qe-language', language);
  applyLanguage();
});
$('quizTheme').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  savePreference('qe-theme', theme);
  applyTheme();
});

buildScope();
mountIcons();
applyLanguage();
applyTheme();
