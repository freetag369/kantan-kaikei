// ビュー間で共有するUIコンポーネント
import { el, formatJPMonth, formatJPMonthRange, yen, formatShortDate } from './utils.js';
import { svgIcon } from './icons.js';
import { state, setState, emit } from './state.js';
import * as store from './store.js';
import { toast } from './ui.js';

// 個人/ビジネス切替ピル
export function profilePill() {
  const profiles = store.getProfiles();
  const wrap = el('div', { class: 'profile-pill', role: 'tablist', 'aria-label': 'プロフィール切替' });
  const indicator = el('div', { class: 'profile-pill-indicator' });
  wrap.append(indicator);
  profiles.forEach((p, i) => {
    const btn = el(
      'button',
      {
        class: `profile-pill-btn${p.id === state.activeProfileId ? ' active' : ''}`,
        role: 'tab',
        'aria-selected': p.id === state.activeProfileId ? 'true' : 'false',
        onclick: () => switchProfile(p.id),
      },
      p.name
    );
    wrap.append(btn);
  });
  const activeIdx = profiles.findIndex((p) => p.id === state.activeProfileId);
  indicator.style.setProperty('--idx', String(Math.max(0, activeIdx)));
  indicator.style.setProperty('--count', String(profiles.length));
  return wrap;
}

export function switchProfile(id) {
  if (id === state.activeProfileId) return;
  store.setActiveProfileId(id);
  setState({ activeProfileId: id });
  // 入力フォームのカテゴリー選択はプロフィール固有のためリセット
  state.inputForm.categoryId = null;
  state.inputForm.editingTxId = null;
  document.documentElement.dataset.profile = id;
  emit('profile', 'input', 'calendar', 'report', 'budget', 'menu');
  toast(`${store.getProfile(id).name}に切り替えました`, { icon: 'swap' });
}

// 月送りナビ(< 2026年9月 (9月1日−9月30日) >)
export function monthNav(month, onChange, { showRange = true } = {}) {
  return el(
    'div',
    { class: 'month-nav' },
    el('button', { class: 'nav-arrow', 'aria-label': '前の月', html: svgIcon('chevronL'), onclick: () => onChange(-1) }),
    el(
      'div',
      { class: 'month-nav-pill' },
      el('span', { class: 'month-nav-title' }, formatJPMonth(month)),
      showRange ? el('span', { class: 'month-nav-range' }, `(${formatJPMonthRange(month)})`) : null
    ),
    el('button', { class: 'nav-arrow', 'aria-label': '次の月', html: svgIcon('chevronR'), onclick: () => onChange(1) })
  );
}

// 年送りナビ
export function yearNav(year, onChange) {
  return el(
    'div',
    { class: 'month-nav' },
    el('button', { class: 'nav-arrow', 'aria-label': '前の年', html: svgIcon('chevronL'), onclick: () => onChange(-1) }),
    el('div', { class: 'month-nav-pill' }, el('span', { class: 'month-nav-title' }, `${year}年`)),
    el('button', { class: 'nav-arrow', 'aria-label': '次の年', html: svgIcon('chevronR'), onclick: () => onChange(1) })
  );
}

// カテゴリーアイコン(色付き丸背景)
export function catIcon(category, { size = '' } = {}) {
  const color = category?.color || '#9ca3af';
  const icon = category?.icon || 'cart';
  return el('span', {
    class: `cat-icon ${size}`,
    style: `color:${color}`,
    html: svgIcon(icon),
  });
}

// 取引リスト行
export function txRow(tx, { onTap, showDate = false } = {}) {
  const cat = store.getCategoryById(tx.categoryId);
  const method = tx.paymentMethodId ? store.getPaymentMethodById(tx.paymentMethodId) : null;
  const sub = [];
  if (showDate) sub.push(formatShortDate(tx.date));
  if (method) sub.push(method.name);
  if (tx.memo) sub.push(tx.memo);
  return el(
    'button',
    { class: 'tx-row', onclick: () => onTap?.(tx) },
    catIcon(cat),
    el(
      'div',
      { class: 'tx-row-main' },
      el('div', { class: 'tx-row-name' }, cat ? cat.name : '(削除済みカテゴリー)'),
      sub.length ? el('div', { class: 'tx-row-sub' }, sub.join(' ・ ')) : null
    ),
    el('div', { class: `tx-row-amount ${tx.type}` }, `${tx.type === 'income' ? '+' : '-'}${yen(tx.amount)}`)
  );
}

// 空状態
export function emptyState(message, icon = 'info') {
  return el('div', { class: 'empty-state' }, el('span', { html: svgIcon(icon) }), el('p', {}, message));
}

// セグメント切替(支出/収入 など)
export function segmented(options, value, onChange, { cls = '' } = {}) {
  const wrap = el('div', { class: `segmented ${cls}`, role: 'tablist' });
  const idx = options.findIndex((o) => o.value === value);
  const indicator = el('div', { class: 'segmented-indicator', style: `--idx:${Math.max(0, idx)}; --count:${options.length}` });
  wrap.append(indicator);
  for (const opt of options) {
    wrap.append(
      el(
        'button',
        {
          class: `segmented-btn${opt.value === value ? ' active' : ''}`,
          role: 'tab',
          'aria-selected': opt.value === value ? 'true' : 'false',
          onclick: () => onChange(opt.value),
        },
        opt.label
      )
    );
  }
  return wrap;
}
