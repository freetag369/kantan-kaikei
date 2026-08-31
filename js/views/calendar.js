// カレンダータブ
import { el, parseDate, toDateStr, addMonths, monthOf, num, yen, signedYen, WEEKDAYS, formatJPDate, todayStr } from '../utils.js';
import { state, on, setState } from '../state.js';
import * as store from '../store.js';
import { profilePill, monthNav, txRow, emptyState } from '../components.js';
import { openTransactionInInput } from './input.js';
import { animateNumber } from '../ui.js';

let root;

export function initCalendarView(container) {
  root = container;
  on('calendar', render);
  on('profile', render);
  render();
}

function render() {
  const month = state.calendarMonth;
  const profileId = state.activeProfileId;
  root.innerHTML = '';

  // ヘッダー
  const header = el(
    'div',
    { class: 'view-header' },
    profilePill(),
    el('div', { class: 'view-title' }, 'カレンダー'),
    el('div', { class: 'header-spacer' })
  );

  // カレンダー生成: 月初の週の日曜〜6週分
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(y, m - 1, 1 - first.getDay());

  // 表示範囲の取引を1パスで日別集計
  const gridStart = toDateStr(start);
  const endD = new Date(start);
  endD.setDate(endD.getDate() + 41);
  const gridEnd = toDateStr(endD);
  const txs = store.getTransactions(profileId, { from: gridStart, to: gridEnd });
  const byDay = new Map();
  for (const t of txs) {
    const e = byDay.get(t.date) || { income: 0, expense: 0 };
    e[t.type] += t.amount;
    byDay.set(t.date, e);
  }
  const monthTxs = txs.filter((t) => monthOf(t.date) === month);
  const totals = store.sumTransactions(monthTxs);

  // 曜日ヘッダー
  const grid = el('div', { class: 'cal-grid card' });
  WEEKDAYS.forEach((w, i) => {
    grid.append(el('div', { class: `cal-wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}` }, w));
  });

  const today = todayStr();
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const ds = toDateStr(d);
    const inMonth = monthOf(ds) === month;
    const dow = d.getDay();
    const sums = byDay.get(ds);
    const cell = el(
      'button',
      {
        class: [
          'cal-cell',
          inMonth ? '' : 'dim',
          dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
          ds === today ? 'today' : '',
          ds === state.calendarSelectedDate ? 'selected' : '',
        ]
          .filter(Boolean)
          .join(' '),
        onclick: () => {
          setState({ calendarSelectedDate: state.calendarSelectedDate === ds ? null : ds }, 'calendar');
        },
      },
      el('span', { class: 'cal-day' }, String(d.getDate())),
      sums?.income ? el('span', { class: 'cal-amt income' }, num(sums.income)) : null,
      sums?.expense ? el('span', { class: 'cal-amt expense' }, num(sums.expense)) : null
    );
    grid.append(cell);
  }

  // 月間合計
  const totalsRow = el(
    'div',
    { class: 'cal-totals card' },
    totalItem('収入', totals.income, 'income', (n) => yen(n)),
    totalItem('支出', totals.expense, 'expense', (n) => yen(n)),
    totalItem('合計', totals.balance, totals.balance >= 0 ? 'income' : 'expense', (n) => signedYen(n))
  );

  // 選択日の取引一覧
  let dayList = null;
  if (state.calendarSelectedDate) {
    const ds = state.calendarSelectedDate;
    const dayTxs = store.getTransactions(profileId, { from: ds, to: ds });
    dayList = el(
      'div',
      { class: 'day-list' },
      el('div', { class: 'day-list-title' }, formatJPDate(ds)),
      dayTxs.length
        ? el('div', { class: 'card list-card' }, dayTxs.map((t) => txRow(t, { onTap: openTransactionInInput })))
        : emptyState('この日の記録はありません', 'calendar')
    );
  }

  const body = el(
    'div',
    { class: 'view-scroll' },
    monthNav(month, (dir) => setState({ calendarMonth: addMonths(month, dir), calendarSelectedDate: null }, 'calendar')),
    grid,
    totalsRow,
    dayList,
    el('div', { class: 'footer-spacer' })
  );

  root.append(header, body);

  function totalItem(label, value, cls, fmt) {
    const valNode = el('div', { class: `cal-total-value ${cls}` }, fmt(value));
    animateNumber(valNode, value, fmt);
    return el('div', { class: 'cal-total' }, el('div', { class: 'cal-total-label' }, label), valNode);
  }
}
