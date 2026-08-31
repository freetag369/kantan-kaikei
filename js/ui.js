// ボトムシート・トースト・確認ダイアログなどの汎用UI部品
import { el, $ } from './utils.js';
import { svgIcon } from './icons.js';

// ================= ボトムシート =================

let sheetCount = 0;

export function openSheet({ title, content, onClose } = {}) {
  sheetCount++;
  const backdrop = el('div', { class: 'sheet-backdrop' });
  const sheet = el(
    'div',
    { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
    el('div', { class: 'sheet-grabber' }),
    title !== undefined
      ? el(
          'div',
          { class: 'sheet-head' },
          el('div', { class: 'sheet-title' }, title),
          el('button', {
            class: 'sheet-close',
            'aria-label': '閉じる',
            html: svgIcon('close'),
            onclick: () => close(),
          })
        )
      : null,
    el('div', { class: 'sheet-body' }, content)
  );
  backdrop.append(sheet);
  document.body.append(backdrop);
  document.body.classList.add('sheet-open');

  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));

  let closed = false;
  function close(result) {
    if (closed) return;
    closed = true;
    sheetCount--;
    backdrop.classList.remove('open');
    setTimeout(() => {
      backdrop.remove();
      if (sheetCount === 0) document.body.classList.remove('sheet-open');
      onClose?.(result);
    }, 280);
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  return { close, sheet };
}

// ================= トースト =================

let toastTimer = null;

export function toast(message, { icon = 'check' } = {}) {
  let node = $('#toast');
  if (!node) {
    node = el('div', { id: 'toast', class: 'toast' });
    document.body.append(node);
  }
  node.innerHTML = `${svgIcon(icon)}<span></span>`;
  node.querySelector('span').textContent = message;
  node.classList.remove('show');
  void node.offsetWidth; // アニメーション再トリガー
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
}

// ================= 確認ダイアログ =================

export function confirmDialog(message, { title = '確認', okLabel = 'OK', danger = false } = {}) {
  return new Promise((resolve) => {
    const backdrop = el('div', { class: 'dialog-backdrop' });
    const dialog = el(
      'div',
      { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true' },
      el('div', { class: 'dialog-title' }, title),
      el('div', { class: 'dialog-message' }, message),
      el(
        'div',
        { class: 'dialog-actions' },
        el('button', { class: 'dialog-btn', onclick: () => done(false) }, 'キャンセル'),
        el('button', { class: `dialog-btn primary${danger ? ' danger' : ''}`, onclick: () => done(true) }, okLabel)
      )
    );
    backdrop.append(dialog);
    document.body.append(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));
    function done(result) {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 200);
      resolve(result);
    }
  });
}

// ================= テキスト入力ダイアログ =================

export function promptDialog(message, { title = '入力', value = '', placeholder = '', okLabel = 'OK' } = {}) {
  return new Promise((resolve) => {
    const input = el('input', { class: 'dialog-input', type: 'text', value, placeholder });
    const backdrop = el('div', { class: 'dialog-backdrop' });
    const dialog = el(
      'div',
      { class: 'dialog', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'dialog-title' }, title),
      message ? el('div', { class: 'dialog-message' }, message) : null,
      input,
      el(
        'div',
        { class: 'dialog-actions' },
        el('button', { class: 'dialog-btn', onclick: () => done(null) }, 'キャンセル'),
        el('button', { class: 'dialog-btn primary', onclick: () => done(input.value.trim()) }, okLabel)
      )
    );
    backdrop.append(dialog);
    document.body.append(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') done(input.value.trim());
    });
    setTimeout(() => input.focus(), 120);
    function done(result) {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 200);
      resolve(result);
    }
  });
}

// ================= 金額カウントアップ演出 =================

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function animateNumber(node, target, format, duration = 500) {
  if (reduceMotion.matches || Math.abs(target) < 1) {
    node.textContent = format(target);
    return;
  }
  const start = performance.now();
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = format(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
