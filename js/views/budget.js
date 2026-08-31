// 予算タブ
import { el, addMonths, yen, num } from '../utils.js';
import { state, on, setState, emit } from '../state.js';
import * as store from '../store.js';
import { profilePill, monthNav, catIcon } from '../components.js';
import { progressBar } from '../charts.js';
import { openSheet, toast } from '../ui.js';
import { svgIcon } from '../icons.js';

let root;

export function initBudgetView(container) {
  root = container;
  on('budget', render);
  on('profile', render);
  render();
}

function render() {
  const month = state.budgetMonth;
  const profileId = state.activeProfileId;
  const { map: budgets, inherited } = store.getEffectiveBudgets(profileId, month);
  const categories = store.getCategories(profileId, 'expense');
  const txs = store.getTransactions(profileId, { month, type: 'expense' });
  const spentByCat = new Map();
  let spentTotal = 0;
  for (const t of txs) {
    spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) || 0) + t.amount);
    spentTotal += t.amount;
  }

  root.innerHTML = '';

  const header = el(
    'div',
    { class: 'view-header' },
    profilePill(),
    el('div', { class: 'view-title' }, '予算'),
    el('div', { class: 'header-spacer' })
  );

  const totalBudget = budgets[store.BUDGET_TOTAL] ?? null;

  const rows = el('div', { class: 'budget-list' });
  rows.append(
    budgetRow({
      icon: null,
      name: '予算合計',
      budget: totalBudget,
      spent: spentTotal,
      onTap: () => openBudgetSheet('予算合計', totalBudget, (v) => {
        store.setBudget(profileId, month, store.BUDGET_TOTAL, v);
        emit('budget');
      }),
      bold: true,
    })
  );
  for (const cat of categories) {
    const b = budgets[cat.id] ?? null;
    rows.append(
      budgetRow({
        icon: catIcon(cat),
        name: cat.name,
        budget: b,
        spent: spentByCat.get(cat.id) || 0,
        onTap: () => openBudgetSheet(cat.name, b, (v) => {
          store.setBudget(profileId, month, cat.id, v);
          emit('budget');
        }),
      })
    );
  }

  const body = el(
    'div',
    { class: 'view-scroll' },
    monthNav(month, (dir) => setState({ budgetMonth: addMonths(month, dir) }, 'budget')),
    inherited ? el('div', { class: 'inherit-note' }, el('span', { html: svgIcon('info') }), '前月までの予算設定を引き継いで表示しています') : null,
    rows,
    el('div', { class: 'footer-spacer' })
  );

  root.append(header, body);
}

function budgetRow({ icon, name, budget, spent, onTap, bold = false }) {
  const hasBudget = budget !== null && budget !== undefined;
  const ratio = hasBudget && budget > 0 ? spent / budget : 0;
  const over = hasBudget && spent > budget;
  const remain = hasBudget ? budget - spent : null;

  return el(
    'button',
    { class: `card budget-row${bold ? ' bold' : ''}`, onclick: onTap },
    el(
      'div',
      { class: 'budget-row-top' },
      icon,
      el('span', { class: 'budget-row-name' }, name),
      el(
        'div',
        { class: 'budget-row-right' },
        hasBudget
          ? el('span', { class: 'budget-row-amount' }, yen(budget))
          : el('span', { class: 'budget-row-unset' }, '未設定'),
        el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
      )
    ),
    hasBudget ? progressBar(ratio, { over }) : progressBar(0),
    hasBudget
      ? el(
          'div',
          { class: 'budget-row-bottom' },
          el('span', { class: 'budget-row-spent' }, `使用 ${yen(spent)}`),
          el(
            'span',
            { class: `budget-row-remain${over ? ' over' : ''}` },
            over ? `${yen(Math.abs(remain))} 超過` : `残り ${yen(remain)}`
          )
        )
      : el('div', { class: 'budget-row-bottom' }, el('span', { class: 'budget-row-spent' }, spent ? `使用 ${yen(spent)}` : '−'))
  );
}

function openBudgetSheet(name, current, onSave) {
  const input = el('input', {
    type: 'text',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    class: 'amount-input sheet-amount',
    value: current ? String(current) : '0',
  });
  input.addEventListener('focus', () => input.select());
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9０-９]/g, '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  });

  const sheetCtl = openSheet({
    title: `${name}の予算`,
    content: el(
      'div',
      { class: 'budget-sheet' },
      el('div', { class: 'amount-wrap' }, el('div', { class: 'amount-pill' }, input), el('span', { class: 'amount-unit' }, '円')),
      el('div', { class: 'budget-sheet-hint' }, '0にすると未設定になります'),
      el(
        'button',
        {
          class: 'save-btn',
          onclick: () => {
            const v = parseInt(input.value, 10) || 0;
            onSave(v > 0 ? v : null);
            sheetCtl.close();
            toast('予算を保存しました');
          },
        },
        el('span', {}, '保存する')
      )
    ),
  });
  setTimeout(() => input.focus(), 350);
}
