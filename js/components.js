// ビュー間で共有するUIコンポーネント
import { el, formatJPMonth, formatJPMonthRange, yen, formatShortDate } from './utils.js';
import { svgIcon } from './icons.js';
import { state, setState, emit } from './state.js';
import * as store from './store.js';
import { toast } from './ui.js';

// 事業(プロフィール)切替ピル。件数に応じてCSS側で文字が縮み、常に1行に並ぶ
export function profilePill() {
  const profiles = store.getProfiles();
  // 3件以上はヘッダーの1行目を独立して使い、事業名が省略されないようにする
  const wrap = el('div', {
    class: `profile-pill${profiles.length >= 3 ? ' wide' : ''}`,
    role: 'tablist',
    'aria-label': '事業切替',
  });
  const indicator = el('div', { class: 'profile-pill-indicator' });
  wrap.append(indicator);
  profiles.forEach((p, i) => {
    const btn = el(
      'button',
      {
        class: `profile-pill-btn${p.id === state.activeProfileId ? ' active' : ''}`,
        role: 'tab',
        'aria-selected': p.id === state.activeProfileId ? 'true' : 'false',
        title: p.name,
        onclick: () => switchProfile(p.id),
      },
      p.name
    );
    wrap.append(btn);
  });
  const activeIdx = profiles.findIndex((p) => p.id === state.activeProfileId);
  indicator.style.setProperty('--idx', String(Math.max(0, activeIdx)));
  // --count はインジケーターの幅とボタンの文字サイズの両方で使う
  indicator.style.setProperty('--count', String(profiles.length));
  wrap.style.setProperty('--count', String(profiles.length));
  return wrap;
}

// そのプロフィールのアクセント配色を <html data-accent> に反映する
export function applyAccent(profileId) {
  document.documentElement.dataset.accent = store.getProfile(profileId)?.accent || 'orange';
}

export function switchProfile(id) {
  if (id === state.activeProfileId) return;
  store.setActiveProfileId(id);
  setState({ activeProfileId: id });
  // 入力フォームのカテゴリー選択はプロフィール固有のためリセット
  state.inputForm.categoryId = null;
  state.inputForm.editingTxId = null;
  applyAccent(id);
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
  const isTransfer = tx.type === 'transfer';
  const cat = isTransfer ? null : store.getCategoryById(tx.categoryId);
  const method = tx.paymentMethodId ? store.getPaymentMethodById(tx.paymentMethodId) : null;
  const sub = [];
  if (showDate) sub.push(formatShortDate(tx.date));
  if (isTransfer) {
    const from = tx.fromPaymentMethodId ? store.getPaymentMethodById(tx.fromPaymentMethodId) : null;
    const to = tx.toPaymentMethodId ? store.getPaymentMethodById(tx.toPaymentMethodId) : null;
    sub.push(`${from ? from.name : '外部'} → ${to ? to.name : '(削除済み)'}`);
  } else if (method) {
    sub.push(method.name);
  }
  if (tx.memo) sub.push(tx.memo);
  const name = isTransfer ? '振替' : cat ? cat.name : '(削除済みカテゴリー)';
  const amountText = isTransfer ? yen(tx.amount) : `${tx.type === 'income' ? '+' : '-'}${yen(tx.amount)}`;
  return el(
    'button',
    { class: 'tx-row', onclick: () => onTap?.(tx) },
    isTransfer ? catIcon({ icon: 'swap', color: '#6b7280' }) : catIcon(cat),
    el(
      'div',
      { class: 'tx-row-main' },
      el('div', { class: 'tx-row-name' }, name),
      sub.length ? el('div', { class: 'tx-row-sub' }, sub.join(' ・ ')) : null
    ),
    el('div', { class: `tx-row-amount ${tx.type}` }, amountText)
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
