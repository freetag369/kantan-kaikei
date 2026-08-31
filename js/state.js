// 実行時状態 + ミニ pub/sub
import { todayStr, thisMonth } from './utils.js';

export const state = {
  tab: 'input',
  activeProfileId: 'personal',
  inputForm: {
    type: 'expense',
    date: todayStr(),
    memo: '',
    amount: '',
    categoryId: null,
    paymentMethodId: null,
    editingTxId: null, // 編集中の取引ID(nullなら新規)
  },
  calendarMonth: thisMonth(),
  calendarSelectedDate: null,
  reportMode: 'month', // 'month' | 'year'
  reportMonth: thisMonth(),
  reportYear: new Date().getFullYear(),
  reportType: 'expense', // 'expense' | 'income'
  budgetMonth: thisMonth(),
};

const listeners = new Map(); // topic -> Set<fn>

export function on(topic, fn) {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic).add(fn);
}

export function emit(...topics) {
  const called = new Set();
  for (const t of topics) {
    for (const fn of listeners.get(t) || []) {
      if (!called.has(fn)) {
        called.add(fn);
        fn();
      }
    }
  }
}

export function setState(patch, ...topics) {
  Object.assign(state, patch);
  if (topics.length) emit(...topics);
}

export function resetInputForm(keepType = true) {
  const type = keepType ? state.inputForm.type : 'expense';
  state.inputForm = {
    type,
    date: state.inputForm.date || todayStr(),
    memo: '',
    amount: '',
    categoryId: null,
    paymentMethodId: state.inputForm.paymentMethodId,
    editingTxId: null,
  };
}
