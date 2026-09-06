// メニュータブ(サブページ含む)
import { el, yen, signedYen, formatJPMonth, escapeHtml } from '../utils.js';
import { svgIcon, ACCENTS, ACCENT_HEX } from '../icons.js';
import { state, on, emit, resetInputForm } from '../state.js';
import * as store from '../store.js';
import { profilePill, catIcon, txRow, emptyState, segmented, applyAccent, switchRow } from '../components.js';
import { donutChart, barChart, balanceChart, ratioBar } from '../charts.js';
import { openSheet, toast, confirmDialog, promptDialog } from '../ui.js';
import { openTransactionInInput } from './input.js';
import { openCategoryEditor as openSharedCategoryEditor } from './category-editor.js';

let root;
const menuState = {
  stack: [], // サブページのスタック
  catType: 'expense',
  catEditMode: false,
  pmEditMode: false,
  profileEditMode: false,
  reportYear: new Date().getFullYear(),
  search: { keyword: '', type: '', from: '', to: '', categoryId: '', paymentMethodId: '' },
};

export function initMenuView(container) {
  root = container;
  on('menu', render);
  on('profile', () => {
    menuState.stack = [];
    // カテゴリーは事業ごとに別物なので、検索条件を持ち越さない
    menuState.search.categoryId = '';
    render();
  });
  render();
}

function push(page) {
  menuState.stack.push(page);
  render();
}

function pop() {
  menuState.stack.pop();
  render();
}

function render() {
  const page = menuState.stack[menuState.stack.length - 1];
  root.innerHTML = '';
  if (!page) return renderMain();
  const renderers = {
    categories: renderCategories,
    payments: renderPayments,
    profiles: renderProfiles,
    search: renderSearch,
    annualBalance: () => renderPeriodBalance('year'),
    allBalance: () => renderPeriodBalance('all'),
    annualCategory: () => renderPeriodCategory('year'),
    allCategory: () => renderPeriodCategory('all'),
    balanceTrend: renderBalanceTrend,
    backup: renderBackup,
  };
  (renderers[page] || renderMain)();
}

// ================= 共通部品 =================

function subHeader(title, { right = null } = {}) {
  return el(
    'div',
    { class: 'view-header' },
    el('button', { class: 'back-btn', 'aria-label': '戻る', html: svgIcon('chevronL'), onclick: pop }),
    el('div', { class: 'view-title' }, title),
    right || el('div', { class: 'header-spacer' })
  );
}

function menuItem(icon, label, onTap, { sub = '' } = {}) {
  return el(
    'button',
    { class: 'menu-item', onclick: onTap },
    el('span', { class: 'menu-item-icon', html: svgIcon(icon) }),
    el(
      'div',
      { class: 'menu-item-main' },
      el('span', { class: 'menu-item-label' }, label),
      sub ? el('span', { class: 'menu-item-sub' }, sub) : null
    ),
    el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
  );
}

function yearNavRow(onChange) {
  return el(
    'div',
    { class: 'month-nav' },
    el('button', { class: 'nav-arrow', 'aria-label': '前の年', html: svgIcon('chevronL'), onclick: () => onChange(-1) }),
    el('div', { class: 'month-nav-pill' }, el('span', { class: 'month-nav-title' }, `${menuState.reportYear}年`)),
    el('button', { class: 'nav-arrow', 'aria-label': '次の年', html: svgIcon('chevronR'), onclick: () => onChange(1) })
  );
}

// ================= メインメニュー =================

function renderMain() {
  const profile = store.getProfile(state.activeProfileId);
  const header = el(
    'div',
    { class: 'view-header' },
    profilePill(),
    el('div', { class: 'view-title' }, 'メニュー'),
    el('div', { class: 'header-spacer' })
  );

  const body = el(
    'div',
    { class: 'view-scroll' },
    el('div', { class: 'section-label' }, '設定'),
    el(
      'div',
      { class: 'card list-card' },
      menuItem('edit', 'カテゴリーの編集', () => push('categories'), { sub: `${profile.name}のカテゴリー` }),
      menuItem('card', '支払い方法の管理', () => push('payments'), { sub: 'すべての事業で共通' }),
      menuItem('briefcase', '事業(プロフィール)の管理', () => push('profiles'), {
        sub: store.getProfiles().map((p) => p.name).join('・'),
      })
    ),
    el('div', { class: 'section-label' }, '入力画面'),
    el(
      'div',
      { class: 'card list-card' },
      switchRow('swap', '「振替」ボタンを表示', store.getSetting('showTransfer'), (on) => {
        store.setSetting('showTransfer', on);
        // 振替を隠したときに入力画面が振替のままだと操作できなくなるので支出に戻す
        if (!on && state.inputForm.type === 'transfer' && !state.inputForm.editingTxId) {
          resetInputForm(false);
        }
        emit('input');
        toast(on ? '振替ボタンを表示します' : '振替ボタンを隠しました');
      }, { sub: 'Suicaチャージなど、支払い方法間の資金移動を記録する' })
    ),
    el('div', { class: 'section-label' }, 'レポート'),
    el(
      'div',
      { class: 'card list-card' },
      menuItem('chart', '年間収支レポート', () => push('annualBalance')),
      menuItem('pie', '年間カテゴリレポート', () => push('annualCategory')),
      menuItem('chart', '全期間収支レポート', () => push('allBalance')),
      menuItem('pie', '全期間カテゴリレポート', () => push('allCategory')),
      menuItem('balance', '残高推移レポート', () => push('balanceTrend')),
      menuItem('search', '取引検索', () => push('search'))
    ),
    el('div', { class: 'section-label' }, 'データ'),
    el(
      'div',
      { class: 'card list-card' },
      menuItem('download', 'バックアップ', () => push('backup'), { sub: 'エクスポート / インポート' })
    ),
    el('div', { class: 'menu-version' }, 'かんたん会計(マルチ対応) v1.3'),
    el('div', { class: 'footer-spacer' })
  );

  root.append(header, body);
}

// ================= 事業(プロフィール)の管理 =================

// 'profile' を emit すると initMenuView のハンドラでページスタックが消え、
// メインメニューに戻ってしまう。この画面ではデータ系トピックだけ流して自前で再描画する。
function afterProfileChange() {
  emit('menu', 'input', 'calendar', 'report', 'budget');
  render();
}

function renderProfiles() {
  const profiles = store.getProfiles();
  const editMode = menuState.profileEditMode;

  const header = subHeader('事業(プロフィール)', {
    right: el(
      'button',
      { class: 'text-btn', onclick: () => { menuState.profileEditMode = !editMode; render(); } },
      editMode ? '完了' : '編集'
    ),
  });

  const addRow = el(
    'button',
    { class: 'card add-row', onclick: () => openProfileEditor(null) },
    el('span', { class: 'add-row-icon', html: svgIcon('plus') }),
    el('span', {}, '事業の追加'),
    el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
  );

  const list = el(
    'div',
    { class: 'card list-card' },
    profiles.map((p, i) =>
      el(
        'div',
        { class: 'cat-edit-row' },
        editMode
          ? el('div', { class: 'reorder-btns' },
              el('button', { class: 'reorder-btn', 'aria-label': '上へ', disabled: i === 0, html: svgIcon('chevronL'), style: 'transform:rotate(90deg)', onclick: () => { store.moveProfile(p.id, -1); afterProfileChange(); } }),
              el('button', { class: 'reorder-btn', 'aria-label': '下へ', disabled: i === profiles.length - 1, html: svgIcon('chevronR'), style: 'transform:rotate(90deg)', onclick: () => { store.moveProfile(p.id, 1); afterProfileChange(); } })
            )
          : null,
        el('span', {
          class: 'cat-icon',
          style: `color:${ACCENT_HEX[p.accent] || ACCENT_HEX.orange}`,
          html: svgIcon(p.kind === 'personal' ? 'person' : 'briefcase'),
        }),
        el('button', { class: 'cat-edit-name', onclick: () => openProfileEditor(p) }, p.name),
        p.id === state.activeProfileId ? el('span', { class: 'profile-active-badge' }, '表示中') : null,
        editMode
          ? el('button', {
              class: 'icon-btn danger',
              'aria-label': '削除',
              disabled: profiles.length <= 1,
              html: svgIcon('trash'),
              onclick: () => deleteProfile(p),
            })
          : el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
      )
    )
  );

  const note = el(
    'div',
    { class: 'menu-item-sub', style: 'padding: 6px 6px 0; line-height: 1.6' },
    '事業ごとに取引・カテゴリー・予算が分かれます。支払い方法はすべての事業で共通です。'
  );

  const body = el('div', { class: 'view-scroll' }, addRow, list, note, el('div', { class: 'footer-spacer' }));
  root.append(header, body);
}

function openProfileEditor(profile) {
  const isNew = !profile;
  const others = store.getProfiles();
  const draft = {
    name: profile?.name || '',
    accent: profile?.accent || ACCENTS.find((a) => !others.some((p) => p.accent === a)) || 'blue',
    kind: profile?.kind || 'business',
    template: 'business',
  };

  const nameInput = el('input', { type: 'text', class: 'sheet-text-input', placeholder: '事業名', value: draft.name, maxlength: '12' });
  nameInput.addEventListener('input', () => (draft.name = nameInput.value));

  const preview = el('span', {
    class: 'cat-icon lg',
    style: `color:${ACCENT_HEX[draft.accent]}`,
    html: svgIcon(draft.kind === 'personal' ? 'person' : 'briefcase'),
  });

  const accentGrid = el(
    'div',
    { class: 'accent-grid' },
    ACCENTS.map((a) =>
      el('button', {
        class: `color-cell${a === draft.accent ? ' selected' : ''}`,
        style: `background:${ACCENT_HEX[a]}`,
        'aria-label': a,
        onclick: (e) => {
          draft.accent = a;
          accentGrid.querySelectorAll('.color-cell').forEach((x) => x.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          preview.style.color = ACCENT_HEX[a];
        },
      })
    )
  );

  // 新規追加時のみ: 初期カテゴリーの決め方を選ぶ
  const copySel = el(
    'select',
    { class: 'search-select' },
    others.map((p) => el('option', { value: p.id }, `${p.name} のカテゴリーをコピー`))
  );
  const copyRow = el('div', { style: 'margin-top: 8px; display: none' }, copySel);

  const tplSel = el(
    'select',
    { class: 'search-select' },
    [
      ['business', '事業用テンプレート(仕入・外注費など)'],
      ['personal', '個人用テンプレート(食費・日用品など)'],
      ['copy', '他の事業からコピー'],
      ['empty', '空(あとで自分で追加)'],
    ].map(([v, label]) => el('option', { value: v }, label))
  );
  tplSel.addEventListener('change', () => {
    draft.template = tplSel.value;
    copyRow.style.display = tplSel.value === 'copy' ? '' : 'none';
  });

  const sheetCtl = openSheet({
    title: isNew ? '事業の追加' : '事業の編集',
    content: el(
      'div',
      { class: 'cat-editor' },
      el('div', { class: 'cat-editor-head' }, preview, nameInput),
      el('div', { class: 'section-label' }, 'カラー'),
      accentGrid,
      isNew ? el('div', { class: 'section-label' }, '初期カテゴリー') : null,
      isNew ? tplSel : null,
      isNew ? copyRow : null,
      el(
        'button',
        {
          class: 'save-btn',
          onclick: () => {
            const name = draft.name.trim();
            if (!name) {
              toast('事業名を入力してください', { icon: 'info' });
              return;
            }
            if (isNew) {
              store.addProfile({
                name,
                accent: draft.accent,
                kind: draft.kind,
                template: draft.template === 'copy' ? 'business' : draft.template,
                copyFromProfileId: draft.template === 'copy' ? copySel.value || null : null,
              });
            } else {
              store.updateProfile(profile.id, { name, accent: draft.accent });
              if (profile.id === state.activeProfileId) applyAccent(profile.id);
            }
            sheetCtl.close();
            afterProfileChange();
            toast(isNew ? '事業を追加しました' : '保存しました');
          },
        },
        el('span', {}, '保存する')
      )
    ),
  });
}

async function deleteProfile(p) {
  if (store.getProfiles().length <= 1) {
    toast('最後の事業は削除できません', { icon: 'info' });
    return;
  }
  const stats = store.profileStats(p.id);
  const ok = await confirmDialog(
    `「${p.name}」を削除します。取引 ${stats.transactions}件・カテゴリー ${stats.categories}件・予算 ${stats.budgets}件がすべて消え、元に戻せません。先にバックアップをおすすめします。`,
    { okLabel: '削除', danger: true }
  );
  if (!ok) return;
  if (stats.transactions > 0) {
    const ok2 = await confirmDialog(`本当に「${p.name}」の取引 ${stats.transactions}件を完全に削除しますか?`, {
      title: '最終確認',
      okLabel: '完全に削除',
      danger: true,
    });
    if (!ok2) return;
  }
  const wasActive = p.id === state.activeProfileId;
  if (!store.removeProfile(p.id)) return;
  if (wasActive) {
    // 表示中の事業が消えたので、残った先頭の事業に切り替える
    state.activeProfileId = store.getActiveProfileId();
    state.inputForm.categoryId = null;
    state.inputForm.editingTxId = null;
    menuState.search.categoryId = '';
    applyAccent(state.activeProfileId);
  }
  afterProfileChange();
  toast('事業を削除しました', { icon: 'trash' });
}

// ================= カテゴリー編集 =================

function renderCategories() {
  const type = menuState.catType;
  const cats = store.getCategories(state.activeProfileId, type);
  const editMode = menuState.catEditMode;

  const header = subHeader('カテゴリー', {
    right: el(
      'button',
      { class: 'text-btn', onclick: () => { menuState.catEditMode = !editMode; render(); } },
      editMode ? '完了' : '編集'
    ),
  });

  const seg = segmented(
    [
      { value: 'expense', label: '支出' },
      { value: 'income', label: '収入' },
    ],
    type,
    (v) => {
      menuState.catType = v;
      render();
    },
    { cls: 'type-seg center' }
  );

  const addRow = el(
    'button',
    { class: 'card add-row', onclick: () => openCategoryEditor(null) },
    el('span', { class: 'add-row-icon', html: svgIcon('plus') }),
    el('span', {}, '新規カテゴリーの追加'),
    el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
  );

  const list = el(
    'div',
    { class: 'card list-card' },
    cats.length
      ? cats.map((cat, i) =>
          el(
            'div',
            { class: 'cat-edit-row' },
            editMode
              ? el('div', { class: 'reorder-btns' },
                  el('button', { class: 'reorder-btn', 'aria-label': '上へ', disabled: i === 0, html: svgIcon('chevronL'), style: 'transform:rotate(90deg)', onclick: () => { store.moveCategory(cat.id, -1); render(); } }),
                  el('button', { class: 'reorder-btn', 'aria-label': '下へ', disabled: i === cats.length - 1, html: svgIcon('chevronR'), style: 'transform:rotate(90deg)', onclick: () => { store.moveCategory(cat.id, 1); render(); } })
                )
              : null,
            catIcon(cat),
            el('button', { class: 'cat-edit-name', onclick: () => openCategoryEditor(cat) }, cat.name),
            editMode
              ? el('button', {
                  class: 'icon-btn danger',
                  'aria-label': '削除',
                  html: svgIcon('trash'),
                  onclick: () => deleteCategory(cat),
                })
              : el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
          )
        )
      : emptyState('カテゴリーがありません')
  );

  const body = el('div', { class: 'view-scroll' }, seg, addRow, list, el('div', { class: 'footer-spacer' }));
  root.append(header, body);
}

async function deleteCategory(cat) {
  const inUse = store.categoryInUse(cat.id);
  const msg = inUse
    ? `「${cat.name}」は取引で使用中です。削除すると入力画面に表示されなくなります(過去の取引は残ります)。`
    : `「${cat.name}」を削除しますか?`;
  const ok = await confirmDialog(msg, { okLabel: '削除', danger: true });
  if (!ok) return;
  store.removeCategory(cat.id);
  emit('menu', 'input', 'report', 'budget');
  toast('カテゴリーを削除しました', { icon: 'trash' });
}

function openCategoryEditor(cat) {
  openSharedCategoryEditor(cat, { profileId: state.activeProfileId, type: menuState.catType });
}

// ================= 支払い方法管理 =================

function renderPayments() {
  const methods = store.getPaymentMethods();
  const editMode = menuState.pmEditMode;
  const balances = store.getPaymentMethodBalances();

  const header = subHeader('支払い方法', {
    right: el(
      'button',
      { class: 'text-btn', onclick: () => { menuState.pmEditMode = !editMode; render(); } },
      editMode ? '完了' : '編集'
    ),
  });

  const addRow = el(
    'button',
    {
      class: 'card add-row',
      onclick: async () => {
        const name = await promptDialog('現金、カード名、電子マネー名など', { title: '支払い方法の追加', placeholder: '例: 楽天カード' });
        if (name) {
          store.addPaymentMethod(name);
          emit('menu', 'input', 'report');
          toast('支払い方法を追加しました');
          render();
        }
      },
    },
    el('span', { class: 'add-row-icon', html: svgIcon('plus') }),
    el('span', {}, '支払い方法の追加'),
    el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
  );

  const list = el(
    'div',
    { class: 'card list-card' },
    methods.length
      ? methods.map((m, i) =>
          el(
            'div',
            { class: 'cat-edit-row' },
            editMode
              ? el('div', { class: 'reorder-btns' },
                  el('button', { class: 'reorder-btn', 'aria-label': '上へ', disabled: i === 0, html: svgIcon('chevronL'), style: 'transform:rotate(90deg)', onclick: () => { store.movePaymentMethod(m.id, -1); render(); } }),
                  el('button', { class: 'reorder-btn', 'aria-label': '下へ', disabled: i === methods.length - 1, html: svgIcon('chevronR'), style: 'transform:rotate(90deg)', onclick: () => { store.movePaymentMethod(m.id, 1); render(); } })
                )
              : null,
            el('span', { class: 'cat-icon', style: 'color: var(--accent)', html: svgIcon('card') }),
            el(
              'button',
              {
                class: 'cat-edit-name',
                onclick: async () => {
                  const name = await promptDialog('', { title: '名前の変更', value: m.name });
                  if (name) {
                    store.updatePaymentMethod(m.id, { name });
                    emit('menu', 'input', 'report');
                    render();
                  }
                },
              },
              m.name
            ),
            // チャージ先になったことがある方法(Suica等のプリペイド)だけ残高を出す
            balances.get(m.id)?.charged
              ? el(
                  'span',
                  { class: `pm-balance${balances.get(m.id).balance < 0 ? ' negative' : ''}` },
                  `残高 ${yen(balances.get(m.id).balance)}`
                )
              : null,
            editMode
              ? el('button', {
                  class: 'icon-btn danger',
                  'aria-label': '削除',
                  html: svgIcon('trash'),
                  onclick: async () => {
                    const inUse = store.paymentMethodInUse(m.id);
                    const msg = inUse
                      ? `「${m.name}」は取引で使用中です。削除すると選択肢から消えます(過去の取引は残ります)。`
                      : `「${m.name}」を削除しますか?`;
                    const ok = await confirmDialog(msg, { okLabel: '削除', danger: true });
                    if (!ok) return;
                    store.removePaymentMethod(m.id);
                    emit('menu', 'input', 'report');
                    toast('削除しました', { icon: 'trash' });
                    render();
                  },
                })
              : el('span', { class: 'row-chevron', html: svgIcon('chevronR') })
          )
        )
      : emptyState('支払い方法がありません', 'card')
  );

  const body = el('div', { class: 'view-scroll' }, addRow, list, el('div', { class: 'footer-spacer' }));
  root.append(header, body);
}

// ================= 取引検索 =================

function renderSearch() {
  const s = menuState.search;
  const profileId = state.activeProfileId;
  const header = subHeader('取引検索');

  const kwInput = el('input', { type: 'search', class: 'search-input', placeholder: 'メモ・カテゴリー名で検索', value: s.keyword });
  kwInput.addEventListener('input', () => {
    s.keyword = kwInput.value;
    updateResults();
  });

  const typeSel = select(
    [
      ['', 'すべて'],
      ['expense', '支出'],
      ['income', '収入'],
      ['transfer', '振替'],
    ],
    s.type,
    (v) => {
      s.type = v;
      updateResults();
    }
  );

  const catOptions = [['', 'すべてのカテゴリー']];
  for (const t of ['expense', 'income']) {
    for (const c of store.getCategories(profileId, t, { includeArchived: true })) {
      catOptions.push([c.id, c.name + (c.archived ? '(削除済)' : '')]);
    }
  }
  const catSel = select(catOptions, s.categoryId, (v) => {
    s.categoryId = v;
    updateResults();
  });

  const pmOptions = [['', 'すべての支払い方法']];
  for (const m of store.getPaymentMethods({ includeArchived: true })) pmOptions.push([m.id, m.name]);
  const pmSel = select(pmOptions, s.paymentMethodId, (v) => {
    s.paymentMethodId = v;
    updateResults();
  });

  const fromInput = el('input', { type: 'date', class: 'date-input', value: s.from });
  fromInput.addEventListener('change', () => {
    s.from = fromInput.value;
    updateResults();
  });
  const toInput = el('input', { type: 'date', class: 'date-input', value: s.to });
  toInput.addEventListener('change', () => {
    s.to = toInput.value;
    updateResults();
  });

  const filters = el(
    'div',
    { class: 'card search-filters' },
    kwInput,
    el('div', { class: 'search-filter-row' }, typeSel, catSel),
    el('div', { class: 'search-filter-row' }, pmSel),
    el('div', { class: 'search-filter-row dates' }, fromInput, el('span', { class: 'date-tilde' }, '〜'), toInput)
  );

  const summary = el('div', { class: 'search-summary' });
  const results = el('div', {});

  const body = el('div', { class: 'view-scroll' }, filters, summary, results, el('div', { class: 'footer-spacer' }));
  root.append(header, body);
  updateResults();

  function updateResults() {
    const txs = store.getTransactions(profileId, {
      keyword: s.keyword || undefined,
      type: s.type || undefined,
      categoryId: s.categoryId || undefined,
      paymentMethodId: s.paymentMethodId || undefined,
      from: s.from || undefined,
      to: s.to || undefined,
    });
    const totals = store.sumTransactions(txs);
    summary.textContent = txs.length
      ? `${txs.length}件 ・ 支出 ${yen(totals.expense)} ・ 収入 ${yen(totals.income)}`
      : '';
    results.innerHTML = '';
    results.append(
      txs.length
        ? el('div', { class: 'card list-card' }, txs.slice(0, 200).map((t) => txRow(t, { showDate: true, onTap: openTransactionInInput })))
        : emptyState('該当する取引がありません', 'search')
    );
    if (txs.length > 200) {
      results.append(el('div', { class: 'search-more-note' }, `他 ${txs.length - 200} 件(条件を絞ってください)`));
    }
  }

  function select(options, value, onChange) {
    const sel = el(
      'select',
      { class: 'search-select' },
      options.map(([v, label]) => el('option', { value: v, selected: v === value }, label))
    );
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }
}

// ================= 収支レポート(年間/全期間) =================

function renderPeriodBalance(mode) {
  const profileId = state.activeProfileId;
  const isYear = mode === 'year';
  const header = subHeader(isYear ? '年間収支レポート' : '全期間収支レポート');

  let items;
  let txs;
  if (isYear) {
    const year = String(menuState.reportYear);
    txs = store.getTransactions(profileId, { year });
    items = [];
    for (let m = 1; m <= 12; m++) {
      const mm = `${year}-${String(m).padStart(2, '0')}`;
      const monthTxs = txs.filter((t) => t.date.startsWith(mm));
      const sums = store.sumTransactions(monthTxs);
      items.push({ label: `${m}月`, ...sums });
    }
  } else {
    txs = store.getTransactions(profileId, {});
    const years = store.getYears(profileId);
    items = years.map((y) => {
      const sums = store.sumTransactions(txs.filter((t) => t.date.startsWith(y + '-')));
      return { label: `${y}年`, ...sums };
    });
  }
  const totals = store.sumTransactions(txs);

  const table = el(
    'div',
    { class: 'card list-card' },
    items.map((it) =>
      el(
        'div',
        { class: 'period-row' },
        el('span', { class: 'period-row-label' }, it.label),
        el(
          'div',
          { class: 'period-row-nums' },
          el('span', { class: 'period-num income' }, `+${yen(it.income).replace('円', '')}`),
          el('span', { class: 'period-num expense' }, `-${yen(it.expense).replace('円', '')}`),
          el('span', { class: `period-num balance ${it.balance >= 0 ? 'income' : 'expense'}` }, signedYen(it.balance).replace('円', ''))
        )
      )
    ),
    el(
      'div',
      { class: 'period-row total' },
      el('span', { class: 'period-row-label' }, '合計'),
      el(
        'div',
        { class: 'period-row-nums' },
        el('span', { class: 'period-num income' }, `+${yen(totals.income).replace('円', '')}`),
        el('span', { class: 'period-num expense' }, `-${yen(totals.expense).replace('円', '')}`),
        el('span', { class: `period-num balance ${totals.balance >= 0 ? 'income' : 'expense'}` }, signedYen(totals.balance).replace('円', ''))
      )
    )
  );

  const hasData = items.some((it) => it.income || it.expense);
  const body = el(
    'div',
    { class: 'view-scroll' },
    isYear ? yearNavRow((dir) => { menuState.reportYear += dir; render(); }) : null,
    hasData ? el('div', { class: 'card chart-card' }, barChart(items)) : null,
    el('div', { class: 'chart-legend' },
      el('span', { class: 'legend-item' }, el('span', { class: 'legend-dot income' }), '収入'),
      el('span', { class: 'legend-item' }, el('span', { class: 'legend-dot expense' }), '支出')
    ),
    hasData ? table : emptyState('記録がありません', 'chart'),
    el('div', { class: 'footer-spacer' })
  );
  root.append(header, body);
}

// ================= カテゴリレポート(年間/全期間) =================

function renderPeriodCategory(mode) {
  const profileId = state.activeProfileId;
  const isYear = mode === 'year';
  const header = subHeader(isYear ? '年間カテゴリレポート' : '全期間カテゴリレポート');

  const filter = isYear ? { year: String(menuState.reportYear) } : {};
  const txs = store.getTransactions(profileId, { ...filter, type: state.reportType });
  const byCat = store.groupByCategory(txs);
  const total = txs.reduce((s, t) => s + t.amount, 0);

  const typeTabs = el(
    'div',
    { class: 'underline-tabs' },
    el('button', { class: `underline-tab${state.reportType === 'expense' ? ' active' : ''}`, onclick: () => { state.reportType = 'expense'; render(); } }, '支出'),
    el('button', { class: `underline-tab${state.reportType === 'income' ? ' active' : ''}`, onclick: () => { state.reportType = 'income'; render(); } }, '収入')
  );

  let content;
  if (!byCat.length) {
    content = emptyState('記録がありません', 'pie');
  } else {
    content = el(
      'div',
      {},
      donutChart(
        byCat.map((x) => ({ label: x.category?.name || '?', value: x.total, color: x.category?.color || '#9ca3af' })),
        { centerLabel: state.reportType === 'expense' ? '支出合計' : '収入合計', centerValue: yen(total) }
      ),
      el(
        'div',
        { class: 'card list-card' },
        byCat.map((x) => {
          const ratio = total ? x.total / total : 0;
          return el(
            'div',
            { class: 'cat-report-row' },
            catIcon(x.category),
            el(
              'div',
              { class: 'cat-report-main' },
              el('div', { class: 'cat-report-line' },
                el('span', { class: 'cat-report-name' }, x.category?.name || '(削除済み)'),
                el('span', { class: 'cat-report-amount' }, yen(x.total))
              ),
              el('div', { class: 'cat-report-line sub' },
                ratioBar(ratio, x.category?.color || '#9ca3af'),
                el('span', { class: 'cat-report-pct' }, `${(ratio * 100).toFixed(1)}%`)
              )
            )
          );
        })
      )
    );
  }

  const body = el(
    'div',
    { class: 'view-scroll' },
    isYear ? yearNavRow((dir) => { menuState.reportYear += dir; render(); }) : null,
    typeTabs,
    content,
    el('div', { class: 'footer-spacer' })
  );
  root.append(header, body);
}

// ================= 残高推移レポート =================

function renderBalanceTrend() {
  const profileId = state.activeProfileId;
  const header = subHeader('残高推移レポート');

  const txs = store.getTransactions(profileId, {});
  let content;
  if (!txs.length) {
    content = emptyState('記録がありません', 'balance');
  } else {
    // 最初の取引月から今月(または最後の取引月)まで月ごとの累積収支
    const months = txs.map((t) => t.date.slice(0, 7)).sort();
    const firstMonth = months[0];
    const lastMonth = months[months.length - 1];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const endMonth = lastMonth > currentMonth ? lastMonth : currentMonth;

    const byMonth = new Map();
    for (const t of txs) {
      if (t.type === 'transfer') continue;
      const mm = t.date.slice(0, 7);
      const e = byMonth.get(mm) || { income: 0, expense: 0 };
      e[t.type] += t.amount;
      byMonth.set(mm, e);
    }

    const items = [];
    let cum = 0;
    let m = firstMonth;
    let guard = 0;
    while (m <= endMonth && guard++ < 240) {
      const e = byMonth.get(m) || { income: 0, expense: 0 };
      cum += e.income - e.expense;
      const [, mo] = m.split('-');
      items.push({ label: m.endsWith('-01') ? `${m.slice(0, 4)}/${Number(mo)}` : `${Number(mo)}`, value: cum, month: m });
      const [yy, mm2] = m.split('-').map(Number);
      const d = new Date(yy, mm2, 1);
      m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    const rows = items
      .slice()
      .reverse()
      .map((it) =>
        el(
          'div',
          { class: 'period-row' },
          el('span', { class: 'period-row-label' }, formatJPMonth(it.month)),
          el('span', { class: `period-num balance ${it.value >= 0 ? 'income' : 'expense'}` }, signedYen(it.value))
        )
      );

    content = el(
      'div',
      {},
      el('div', { class: 'card chart-card' }, balanceChart(items.slice(-24))),
      el('div', { class: 'section-label' }, '月末時点の累積収支'),
      el('div', { class: 'card list-card' }, rows)
    );
  }

  const body = el('div', { class: 'view-scroll' }, content, el('div', { class: 'footer-spacer' }));
  root.append(header, body);
}

// ================= バックアップ =================

function renderBackup() {
  const header = subHeader('バックアップ');
  const counts = store.countAll();

  const fileInput = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      // 内容を先に検証してから確認
      const parsed = JSON.parse(text);
      if (parsed.app !== store.APP_ID) throw new Error('このアプリのバックアップファイルではありません。');
      const txCount = parsed.data?.transactions?.length ?? 0;
      const ok = await confirmDialog(
        `バックアップ(取引 ${txCount}件、${parsed.exportedAt ? parsed.exportedAt.slice(0, 10) + ' 作成' : ''})を読み込みます。現在のデータはすべて置き換えられます。よろしいですか?`,
        { okLabel: '読み込む', danger: true }
      );
      if (!ok) return;
      store.importData(text);
      state.activeProfileId = store.getActiveProfileId();
      applyAccent(state.activeProfileId);
      state.inputForm.categoryId = null;
      menuState.stack = [];
      emit('menu', 'input', 'calendar', 'report', 'budget', 'profile');
      toast('データを復元しました');
    } catch (e) {
      await confirmDialog(String(e.message || e), { title: '読み込みエラー', okLabel: 'OK' });
    } finally {
      fileInput.value = '';
    }
  });

  const body = el(
    'div',
    { class: 'view-scroll' },
    el(
      'div',
      { class: 'card backup-card' },
      el('div', { class: 'backup-title', html: `${svgIcon('download')}<span>エクスポート</span>` }),
      el('p', { class: 'backup-desc' }, `現在のデータ(取引 ${counts.transactions}件)をJSONファイルとして保存します。定期的なバックアップをおすすめします。`),
      el(
        'button',
        {
          class: 'save-btn',
          onclick: () => {
            const blob = new Blob([store.exportData()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = el('a', { href: url, download: `kantan-kaikei-${new Date().toISOString().slice(0, 10)}.json` });
            document.body.append(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            toast('エクスポートしました');
          },
        },
        el('span', {}, 'エクスポートする')
      )
    ),
    el(
      'div',
      { class: 'card backup-card' },
      el('div', { class: 'backup-title', html: `${svgIcon('upload')}<span>インポート</span>` }),
      el('p', { class: 'backup-desc' }, 'エクスポートしたJSONファイルからデータを復元します。現在のデータは置き換えられます。'),
      el('button', { class: 'save-btn secondary', onclick: () => fileInput.click() }, el('span', {}, 'ファイルを選択する')),
      fileInput
    ),
    el('div', { class: 'footer-spacer' })
  );
  root.append(header, body);
}
