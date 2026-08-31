// 日付・金額・DOMユーティリティ
// 日付は常に "YYYY-MM-DD" 文字列で扱う(UTC解釈バグ回避のためDate化はローカルコンストラクタのみ)

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// monthStr: "YYYY-MM"
export function monthOf(dateStr) {
  return dateStr.slice(0, 7);
}

export function thisMonth() {
  return monthOf(todayStr());
}

export function addMonths(monthStr, n) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function daysInMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function formatJPDate(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${WEEKDAYS[d.getDay()]})`;
}

export function formatJPMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return `${y}年${m}月`;
}

export function formatJPMonthRange(monthStr) {
  const [, m] = monthStr.split('-').map(Number);
  return `${m}月1日－${m}月${daysInMonth(monthStr)}日`;
}

export function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

export function yen(n) {
  return `${Math.round(n).toLocaleString('ja-JP')}円`;
}

export function num(n) {
  return Math.round(n).toLocaleString('ja-JP');
}

export function signedYen(n) {
  return `${n >= 0 ? '+' : '-'}${Math.abs(Math.round(n)).toLocaleString('ja-JP')}円`;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// DOM生成ヘルパー
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
