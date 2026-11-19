import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
import { workBackgrounds } from './work-backgrounds.js?v=1.6.4';

const $ = id => document.getElementById(id);
const language = () => document.documentElement.lang === 'en' ? 'en' : 'zh';
const label = (zh, en) => language() === 'en' ? en : zh;

export function renderWorkBackground(target, id) {
  const background = workBackgrounds[id];
  target.hidden = !background;
  target.dataset.workBackground = background ? id : '';
  target.replaceChildren();
  if (!background) return;

  const { composer, year, description } = background[language()];
  const meta = document.createElement('p');
  meta.className = 'work-background-meta';
  meta.textContent = `${composer} · ${year}`;
  const text = document.createElement('p');
  text.className = 'work-background-description';
  text.textContent = description;
  const source = document.createElement('a');
  source.className = 'work-background-source';
  source.href = background.source;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.textContent = label('资料来源 ↗', 'Source ↗');
  target.append(meta, text, source);
}

export function createWorkDetails({ data, apiFetch, getToken, getUser, openAuth, notify, onReport }) {
  const tracks = new Map(data.flatMap(([, composers]) => composers.flatMap(([, works]) => works)));
  const backgroundDialog = $('workBackgroundDialog');
  const reportDialog = $('workReportDialog');
  const reviewDialog = $('workReportReview');
  const form = $('workReportForm');
  const body = $('workReportBody');
  const email = $('workReportEmail');
  const submit = $('workReportSubmit');
  const feedback = $('workReportFeedback');
  let activeTrack;
  let owner;
  let requestId;
  let submitting = false;

  function updateAuth() {
    const user = getUser();
    if (owner !== user?.id) {
      form.reset();
      owner = user?.id;
      requestId = undefined;
      feedback.textContent = '';
    }
    form.hidden = !user;
    $('reportGuest').hidden = !!user;
  }

  function openBackground(id) {
    if (!tracks.has(id)) return;
    $('workBackgroundTitle').textContent = tracks.get(id);
    renderWorkBackground($('workBackgroundContent'), id);
    if (!backgroundDialog.open) backgroundDialog.showModal();
  }

  function openReport(id) {
    if (!tracks.has(id) || submitting) return;
    if (id !== activeTrack) {
      form.reset();
      requestId = undefined;
      feedback.textContent = '';
    }
    activeTrack = id;
    $('workReportTrack').textContent = tracks.get(id);
    updateAuth();
    if (!reportDialog.open) reportDialog.showModal();
  }

  function openReview(report) {
    $('reportReviewTrack').textContent = tracks.get(Number(report.track_id)) || String(report.track_id);
    $('reportReviewMeta').textContent = [report.author_name, new Date(report.created_at).toLocaleString(language() === 'en' ? 'en' : 'zh-CN')].join(' · ');
    $('reportReviewBody').textContent = report.body;
    $('reportReviewEmail').textContent = report.contact_email || '';
    $('reportReviewContact').hidden = !report.contact_email;
    reviewDialog.showModal();
  }

  function resetReview() {
    if (reviewDialog.open) reviewDialog.close();
    for (const id of ['reportReviewTrack', 'reportReviewMeta', 'reportReviewBody', 'reportReviewEmail']) $(id).textContent = '';
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !getUser()) return;
    const description = body.value.trim();
    if (!description) {
      feedback.textContent = label('请填写反馈内容。', 'Enter your feedback.');
      body.focus();
      return;
    }
    const author = getUser().id;
    const contact = email.value.trim() || null;
    submitting = true;
    submit.disabled = true;
    feedback.textContent = '';
    try {
      const token = await getToken();
      if (!token || getUser()?.id !== author) throw new Error('Session expired');
      const id = requestId ||= crypto.randomUUID();
      await apiFetch(`${SUPABASE_URL}/rest/v1/rpc/qe_submit_report`, {
        method: 'POST',
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, work_id: activeTrack, feedback: description, reply_email: contact }),
      });
      if (getUser()?.id === author) {
        form.reset();
        requestId = undefined;
        reportDialog.close();
        notify(label('反馈已发送给管理员。', 'Your report was sent to the administrator.'));
        onReport();
      }
    } catch (error) {
      if (getUser()?.id === author) {
        feedback.textContent = error.status === 404
          ? label('反馈服务暂未启用。', 'The reporting service is not enabled yet.')
          : label('发送失败。请保留内容，稍后重试。', 'Could not send the report. Your draft is ready to retry.');
      }
    } finally {
      submitting = false;
      submit.disabled = false;
    }
  });
  form.addEventListener('input', () => { requestId = undefined; });
  $('reportLogin').addEventListener('click', openAuth);
  $('closeWorkBackground').addEventListener('click', () => backgroundDialog.close());
  $('closeWorkReport').addEventListener('click', () => reportDialog.close());
  $('closeReportReview').addEventListener('click', resetReview);
  reviewDialog.addEventListener('close', () => { if (!reviewDialog.open) resetReview(); });
  new MutationObserver(() => {
    for (const target of document.querySelectorAll('[data-work-background]')) {
      renderWorkBackground(target, Number(target.dataset.workBackground));
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  return { openBackground, openReport, openReview, resetReview, updateAuth };
}
