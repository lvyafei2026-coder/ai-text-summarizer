const MAX_CHARS = 8000;

const inputEl = document.getElementById('inputText');
const charCountEl = document.getElementById('charCount');
const btn = document.getElementById('summarizeBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const resultTextEl = document.getElementById('resultText');
const resultMetaEl = document.getElementById('resultMeta');

inputEl.addEventListener('input', () => {
  const len = inputEl.value.length;
  charCountEl.textContent = len;
  charCountEl.style.color = len > MAX_CHARS ? '#dc2626' : '';
});

async function summarize() {
  const tr = (window.__i18n && window.__i18n.t) || {};
  const base = (window.__i18n && window.__i18n.base) || '';
  const text = inputEl.value.trim();
  const length = document.getElementById('length').value;

  errorEl.style.display = 'none';
  resultEl.classList.remove('show');

  if (text.length < 100) {
    showError(tr.errShort || 'Please paste at least 100 characters.');
    return;
  }

  btn.disabled = true;
  loadingEl.style.display = 'flex';

  try {
    const res = await fetch(base + '/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, length })
    });

    if (res.status === 429) {
      showError(tr.errRateLimit || 'Too many requests. Please wait a minute and try again.');
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      showError(data.error || (tr.errGeneric || 'Something went wrong.'));
      return;
    }

    resultTextEl.textContent = data.output;
    const wc = data.output.split(/\s+/).filter(Boolean).length;
    resultMetaEl.textContent = (tr.metaWords || 'Words:') + ' ' + wc;
    resultEl.classList.add('show');
  } catch (err) {
    console.error(err);
    showError(tr.errNetwork || 'Network error. Please try again.');
  } finally {
    btn.disabled = false;
    loadingEl.style.display = 'none';
  }
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function copyResult() {
  const text = resultTextEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const el = document.getElementById('copyCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy:', text); });
}

window.summarize = summarize;
window.copyResult = copyResult;