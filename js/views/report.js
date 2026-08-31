// レポートタブ(月間/年間)
import { el, addMonths, yen, num, signedYen } from '../utils.js';
import { state, on, setState } from '../state.js';
import * as store from '../store.js';
import { profilePill, monthNav, yearNav, catIcon, txRow, emptyState, segmented } from '../components.js';
import { donutChart, ratioBar } from '../charts.js';
import { openSheet, animateNumber } from '../ui.js';
import { openTransactionInInput } from './input.js';
import { svgIcon } from '../icons.js';

let root;

export function initReportView(container) {
  root = container;
  on('report', render);
  on('profile', render);
  render();
}

function render() {
  const profileId = state.activeProfileId;
  const isMonth = state.reportMode === 'month';
  const filter = isMonth ? { month: state.reportMonth } : { year: String(state.reportYear) };
  const txs = store.getTransactions(profileId, filter);
  const totals = store.sumTransactions(txs);
  const typeTxs = txs.filter((t) => t.type === state.reportType);
  const byCat = store.groupByCategory(typeTxs);
  const byMethod = store.groupByPaymentMethod(typeTxs);
  const typeTotal = typeTxs.reduce((s, t) => s + t.amount, 0);

  root.innerHTML = '';

  const header = el(
    'div',
    { class: 'view-header' },
    profilePill(),
    segmented(
      [
        { value: 'month', label: '月間' },
        { value: 'year', label: '年間' },
      ],
      state.reportMode,
      (v) => setState({ reportMode: v }, 'report'),
      { cls: 'type-seg' }
    ),
    el('div', { class: 'header-spacer' })
  );

  const nav = isMonth
    ? monthNav(state.reportMonth, (dir) => setState({ reportMonth: addMonths(state.reportMonth, dir) }, 'report'))
    : yearNav(state.reportYear, (dir) => setState({ reportYear: state.reportYear + dir }, 'report'));

  // サマリーカード
  const summary = el(
    'div',
    { class: 'summary-grid' },
    summaryCard('支出', -totals.expense, 'expense'),
    summaryCard('収入', totals.income, 'income'),
    summaryCard('収支', totals.balance, totals.balance >= 0 ? 'income' : 'expense', true)
  );

  // 支出/収入 切替タブ
  const typeTabs = el(
    'div',
    { class: 'underline-tabs' },
    tabBtn('expense', '支出'),
    tabBtn('income', '収入')
  );

  // ドーナツ+カテゴリーリスト
  let breakdown;
  if (!byCat.length) {
    breakdown = emptyState(`${state.reportType === 'expense' ? '支出' : '収入'}の記録がありません`, 'pie');
  } else {
    const donut = donutChart(
      byCat.map((x) => ({ label: x.category?.name || '?', value: x.total, color: x.category?.color || '#9ca3af' })),
      { centerLabel: state.reportType === 'expense' ? '支出合計' : '収入合計', centerValue: yen(typeTotal) }
    );
    const list = el(
      'div',
      { class: 'card list-card' },
      byCat.map((x) => {
        const ratio = typeTotal ? x.total / typeTotal : 0;
        return el(
          'button',
          { class: 'cat-report-row', onclick: () => openCategorySheet(x.category, filter) },
          catIcon(x.category),
          el(
            'div',
            { class: 'cat-report-main' },
            el(
              'div',
              { class: 'cat-report-line' },
              el('span', { class: 'cat-report-name' }, x.category?.name || '(削除済み)'),
              el('span', { class: 'cat-report-amount' }, yen(x.total))
            ),
            el(
              'div',
              { class: 'cat-report-line sub' },
              ratioBar(ratio, x.category?.color || '#9ca3af'),
              el('span', { class: 'cat-report-pct' }, `${(ratio * 100).toFixed(1)}%`)
            )
          ),
          el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
        );
      })
    );
    breakdown = el('div', {}, donut, list);
  }

  // 支払い方法別集計
  let methodSection = null;
  if (byMethod.length && typeTotal > 0) {
    methodSection = el(
      'div',
      { class: 'form-section' },
      el('div', { class: 'section-label' }, '支払い方法別'),
      el(
        'div',
        { class: 'card list-card' },
        byMethod.map((x) => {
          const ratio = typeTotal ? x.total / typeTotal : 0;
          return el(
            'div',
            { class: 'method-report-row' },
            el('span', { class: 'method-report-icon', html: svgIcon(x.method ? 'card' : 'wallet') }),
            el('span', { class: 'method-report-name' }, x.method ? x.method.name : '指定なし'),
            el('span', { class: 'method-report-pct' }, `${(ratio * 100).toFixed(1)}%`),
            el('span', { class: 'method-report-amount' }, yen(x.total))
          );
        })
      )
    );
  }

  const body = el(
    'div',
    { class: 'view-scroll' },
    nav,
    summary,
    typeTabs,
    breakdown,
    methodSection,
    el('div', { class: 'footer-spacer' })
  );

  root.append(header, body);

  function summaryCard(label, value, cls, wide = false) {
    const fmt = (n) => signedYen(n);
    const valNode = el('div', { class: `summary-value ${cls}` }, fmt(value));
    animateNumber(valNode, value, fmt);
    return el('div', { class: `card summary-card${wide ? ' wide' : ''}` }, el('div', { class: 'summary-label' }, label), valNode);
  }

  function tabBtn(value, label) {
    return el(
      'button',
      {
        class: `underline-tab${state.reportType === value ? ' active' : ''}`,
        onclick: () => setState({ reportType: value }, 'report'),
      },
      label
    );
  }
}

// カテゴリー内の取引一覧シート
function openCategorySheet(category, filter) {
  if (!category) return;
  const txs = store.getTransactions(state.activeProfileId, { ...filter, categoryId: category.id });
  const total = txs.reduce((s, t) => s + t.amount, 0);
  const sheetCtl = openSheet({
    title: `${category.name} ・ ${yen(total)}`,
    content: el(
      'div',
      { class: 'sheet-list' },
      txs.length
        ? txs.map((t) =>
            txRow(t, {
              showDate: true,
              onTap: (tx) => {
                sheetCtl.close();
                openTransactionInInput(tx);
              },
            })
          )
        : emptyState('記録がありません')
    ),
  });
}
