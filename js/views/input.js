// 入力タブ
import { el, $, formatJPDate, addDays, todayStr } from '../utils.js';
import { svgIcon } from '../icons.js';
import { state, on, emit, resetInputForm, setState } from '../state.js';
import * as store from '../store.js';
import { toast, confirmDialog } from '../ui.js';
import { profilePill, catIcon, segmented, emptyState } from '../components.js';

let root;

export function initInputView(container) {
  root = container;
  on('input', render);
  on('profile', render);
  render();
}

// 取引を入力タブで編集モードで開く(他ビューから呼ばれる)
export function openTransactionInInput(tx) {
  state.inputForm = {
    type: tx.type,
    date: tx.date,
    memo: tx.memo,
    amount: String(tx.amount),
    categoryId: tx.categoryId,
    paymentMethodId: tx.paymentMethodId,
    fromPaymentMethodId: tx.fromPaymentMethodId || null,
    toPaymentMethodId: tx.toPaymentMethodId || null,
    editingTxId: tx.id,
  };
  setState({ tab: 'input' }, 'tab', 'input');
}

function render() {
  const form = state.inputForm;
  const isExpense = form.type === 'expense';
  const isTransfer = form.type === 'transfer';
  const editing = !!form.editingTxId;
  const categories = isTransfer ? [] : store.getCategories(state.activeProfileId, form.type);
  const methods = store.getPaymentMethods();

  root.innerHTML = '';

  // ===== ヘッダー =====
  const header = el(
    'div',
    { class: 'view-header' },
    profilePill(),
    segmented(
      [
        { value: 'expense', label: '支出' },
        { value: 'income', label: '収入' },
        { value: 'transfer', label: '振替' },
      ],
      form.type,
      (v) => {
        form.type = v;
        form.categoryId = null;
        render();
      },
      { cls: 'type-seg' }
    ),
    el('div', { class: 'header-spacer' })
  );

  // ===== 編集モードバナー =====
  const editBanner = editing
    ? el(
        'div',
        { class: 'edit-banner' },
        el('span', { html: svgIcon('edit') }),
        el('span', {}, '取引を編集中'),
        el(
          'button',
          {
            class: 'edit-banner-cancel',
            onclick: () => {
              resetInputForm();
              render();
            },
          },
          'キャンセル'
        )
      )
    : null;

  // ===== 日付行 =====
  const dateInput = el('input', {
    type: 'date',
    class: 'date-hidden-input',
    value: form.date,
    'aria-label': '日付を選択',
  });
  dateInput.addEventListener('change', () => {
    if (dateInput.value) {
      form.date = dateInput.value;
      render();
    }
  });
  const dateRow = el(
    'div',
    { class: 'form-row' },
    el('span', { class: 'form-label' }, '日付'),
    el(
      'div',
      { class: 'form-value date-nav' },
      el('button', { class: 'nav-arrow sm', 'aria-label': '前日', html: svgIcon('chevronL'), onclick: () => { form.date = addDays(form.date, -1); render(); } }),
      el(
        'div',
        { class: 'date-pill' },
        el('span', {}, formatJPDate(form.date)),
        dateInput
      ),
      el('button', { class: 'nav-arrow sm', 'aria-label': '翌日', html: svgIcon('chevronR'), onclick: () => { form.date = addDays(form.date, 1); render(); } })
    )
  );

  // ===== メモ行 =====
  const memoInput = el('input', {
    type: 'text',
    class: 'memo-input',
    placeholder: '未入力',
    value: form.memo,
    maxlength: '100',
  });
  memoInput.addEventListener('input', () => (form.memo = memoInput.value));
  const memoRow = el('div', { class: 'form-row' }, el('span', { class: 'form-label' }, 'メモ'), el('div', { class: 'form-value' }, memoInput));

  // ===== 金額行 =====
  const amountInput = el('input', {
    type: 'text',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    class: 'amount-input',
    value: form.amount || '0',
    'aria-label': '金額',
  });
  amountInput.addEventListener('focus', () => amountInput.select());
  amountInput.addEventListener('input', () => {
    amountInput.value = amountInput.value.replace(/[^0-9０-９]/g, '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    form.amount = amountInput.value;
  });
  const amountRow = el(
    'div',
    { class: 'form-row' },
    el('span', { class: 'form-label' }, isTransfer ? '金額' : isExpense ? '支出' : '収入'),
    el('div', { class: 'form-value amount-wrap' }, el('div', { class: 'amount-pill' }, amountInput), el('span', { class: 'amount-unit' }, '円'))
  );

  // ===== カテゴリーグリッド(振替時は非表示) =====
  if (!isTransfer && !form.categoryId && categories.length) form.categoryId = categories[0].id;
  const grid = categories.length
    ? el('div', { class: 'cat-grid' })
    : emptyState('カテゴリーがありません。メニュー →「カテゴリーの編集」から追加してください。', 'info');
  for (const cat of categories) {
    const btn = el(
      'button',
      {
        class: `cat-cell${cat.id === form.categoryId ? ' selected' : ''}`,
        onclick: () => {
          form.categoryId = cat.id;
          grid.querySelectorAll('.cat-cell').forEach((c) => c.classList.remove('selected'));
          btn.classList.add('selected');
          btn.classList.remove('pop');
          void btn.offsetWidth;
          btn.classList.add('pop');
        },
      },
      catIcon(cat, { size: 'lg' }),
      el('span', { class: 'cat-cell-name' }, cat.name)
    );
    grid.append(btn);
  }

  // ===== 支払い方法チップ =====
  // 振替時は「チャージ元(から)」「チャージ先(へ)」の2列に置き換える
  const methodSections = [];
  if (isTransfer) {
    if (methods.length) {
      const fromChips = el('div', { class: 'method-chips' });
      fromChips.append(makeMethodChip(null, form, fromChips, 'fromPaymentMethodId', '外部(残高調整)'));
      for (const m of methods) fromChips.append(makeMethodChip(m, form, fromChips, 'fromPaymentMethodId'));
      const toChips = el('div', { class: 'method-chips' });
      for (const m of methods) toChips.append(makeMethodChip(m, form, toChips, 'toPaymentMethodId'));
      methodSections.push(
        el('div', { class: 'form-section' }, el('div', { class: 'section-label' }, 'チャージ元(から)'), fromChips),
        el('div', { class: 'form-section' }, el('div', { class: 'section-label' }, 'チャージ先(へ)'), toChips)
      );
    } else {
      methodSections.push(
        el(
          'div',
          { class: 'form-section' },
          emptyState('支払い方法がありません。メニュー →「支払い方法の編集」から追加してください。', 'info')
        )
      );
    }
  } else if (methods.length) {
    const chips = el('div', { class: 'method-chips' });
    chips.append(makeMethodChip(null, form, chips));
    for (const m of methods) chips.append(makeMethodChip(m, form, chips));
    methodSections.push(el('div', { class: 'form-section' }, el('div', { class: 'section-label' }, '支払い方法'), chips));
  }

  // ===== 保存ボタン =====
  const saveBtn = el(
    'button',
    {
      class: 'save-btn',
      onclick: () => save(saveBtn),
    },
    el('span', {}, editing ? '取引を更新する' : isTransfer ? '振替を記録する' : isExpense ? '支出を入力する' : '収入を入力する')
  );

  const footer = el('div', { class: 'input-footer' });
  if (editing) {
    footer.append(
      el('button', {
        class: 'delete-btn',
        'aria-label': '削除',
        html: svgIcon('trash'),
        onclick: async () => {
          const ok = await confirmDialog('この取引を削除しますか?', { okLabel: '削除', danger: true });
          if (!ok) return;
          store.deleteTransaction(form.editingTxId);
          resetInputForm();
          emit('input', 'calendar', 'report', 'budget');
          toast('取引を削除しました', { icon: 'trash' });
        },
      })
    );
  }
  footer.append(saveBtn);

  const body = el(
    'div',
    { class: 'view-scroll input-body' },
    editBanner,
    el('div', { class: 'card form-card' }, dateRow, el('div', { class: 'form-sep' }), memoRow, el('div', { class: 'form-sep' }), amountRow),
    ...methodSections,
    isTransfer ? null : el('div', { class: 'form-section' }, el('div', { class: 'section-label' }, 'カテゴリー'), grid),
    el('div', { class: 'footer-spacer' })
  );

  root.append(header, body, footer);

  function save(btn) {
    const amount = parseInt(form.amount, 10);
    if (!amount || amount <= 0) {
      toast('金額を入力してください', { icon: 'info' });
      amountInput.focus();
      return;
    }
    if (isTransfer) {
      if (!form.toPaymentMethodId) {
        toast('チャージ先を選択してください', { icon: 'info' });
        return;
      }
      if (form.fromPaymentMethodId === form.toPaymentMethodId) {
        toast('チャージ元と先が同じです', { icon: 'info' });
        return;
      }
    } else if (!form.categoryId) {
      toast('カテゴリーを選択してください', { icon: 'info' });
      return;
    }
    // 編集で種別を切り替えても前の種別のフィールドが残らないよう、常に全フィールドを明示する
    const data = {
      profileId: state.activeProfileId,
      type: form.type,
      date: form.date,
      amount,
      categoryId: isTransfer ? null : form.categoryId,
      paymentMethodId: isTransfer ? null : form.paymentMethodId,
      fromPaymentMethodId: isTransfer ? form.fromPaymentMethodId : null,
      toPaymentMethodId: isTransfer ? form.toPaymentMethodId : null,
      memo: form.memo.trim(),
    };
    if (editing) {
      store.updateTransaction(form.editingTxId, data);
      toast('取引を更新しました');
    } else {
      store.addTransaction(data);
      toast(isTransfer ? '振替を記録しました' : form.type === 'expense' ? '支出を記録しました' : '収入を記録しました');
    }
    btn.classList.add('saved');
    setTimeout(() => btn.classList.remove('saved'), 500);
    const keepDate = form.date;
    resetInputForm();
    state.inputForm.date = keepDate;
    emit('input', 'calendar', 'report', 'budget');
  }
}

// field: form のどのフィールドに書き込むか(通常の支払い方法 / 振替の元・先)
function makeMethodChip(method, form, chips, field = 'paymentMethodId', noneLabel = '指定なし') {
  const id = method ? method.id : null;
  const chip = el(
    'button',
    {
      class: `method-chip${form[field] === id ? ' selected' : ''}`,
      onclick: () => {
        form[field] = id;
        chips.querySelectorAll('.method-chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
      },
    },
    method ? el('span', { class: 'method-chip-icon', html: svgIcon('card') }) : null,
    el('span', {}, method ? method.name : noneLabel)
  );
  return chip;
}
