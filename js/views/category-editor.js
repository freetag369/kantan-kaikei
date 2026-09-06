// カテゴリーの追加・編集シート(入力画面とメニューのカテゴリー編集で共用)
import { el } from '../utils.js';
import { svgIcon, PICKABLE_ICONS, PALETTE } from '../icons.js';
import { state, emit } from '../state.js';
import * as store from '../store.js';
import { openSheet, toast } from '../ui.js';

// cat: 既存カテゴリー(null なら新規)
// profileId / type: 新規作成先(既存編集時はカテゴリー自身の値を使う)
// onSaved(cat): 保存後に呼ばれる(呼び出し元の再描画用)
export function openCategoryEditor(cat, { profileId = state.activeProfileId, type = 'expense', onSaved } = {}) {
  const isNew = !cat;
  const draft = {
    name: cat?.name || '',
    icon: cat?.icon || 'cart',
    color: cat?.color || PALETTE[0],
  };

  const nameInput = el('input', { type: 'text', class: 'sheet-text-input', placeholder: 'カテゴリー名', value: draft.name, maxlength: '20' });
  nameInput.addEventListener('input', () => (draft.name = nameInput.value));

  const preview = el('span', { class: 'cat-icon lg', style: `color:${draft.color}`, html: svgIcon(draft.icon) });

  const iconGrid = el(
    'div',
    { class: 'icon-grid' },
    PICKABLE_ICONS.map((name) =>
      el('button', {
        class: `icon-cell${name === draft.icon ? ' selected' : ''}`,
        'aria-label': name,
        html: svgIcon(name),
        onclick: (e) => {
          draft.icon = name;
          iconGrid.querySelectorAll('.icon-cell').forEach((c) => c.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          preview.innerHTML = svgIcon(draft.icon);
        },
      })
    )
  );

  const colorRow = el(
    'div',
    { class: 'color-grid' },
    PALETTE.map((c) =>
      el('button', {
        class: `color-cell${c === draft.color ? ' selected' : ''}`,
        style: `background:${c}`,
        'aria-label': c,
        onclick: (e) => {
          draft.color = c;
          colorRow.querySelectorAll('.color-cell').forEach((x) => x.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          preview.style.color = c;
        },
      })
    )
  );

  const typeLabel = (cat?.type || type) === 'income' ? '収入' : '支出';
  const sheetCtl = openSheet({
    title: isNew ? `新規カテゴリー(${typeLabel})` : 'カテゴリーの編集',
    content: el(
      'div',
      { class: 'cat-editor' },
      el('div', { class: 'cat-editor-head' }, preview, nameInput),
      el('div', { class: 'section-label' }, 'アイコン'),
      iconGrid,
      el('div', { class: 'section-label' }, 'カラー'),
      colorRow,
      el(
        'button',
        {
          class: 'save-btn',
          onclick: () => {
            const name = draft.name.trim();
            if (!name) {
              toast('名前を入力してください', { icon: 'info' });
              nameInput.focus();
              return;
            }
            let saved;
            if (isNew) {
              saved = store.addCategory(profileId, type, { name, icon: draft.icon, color: draft.color });
            } else {
              store.updateCategory(cat.id, { name, icon: draft.icon, color: draft.color });
              saved = store.getCategoryById(cat.id);
            }
            sheetCtl.close();
            // 呼び出し元が選択状態などを整えてから各ビューを再描画する
            onSaved?.(saved);
            emit('menu', 'input', 'report', 'budget');
            toast(isNew ? 'カテゴリーを追加しました' : 'カテゴリーを保存しました');
          },
        },
        el('span', {}, '保存する')
      )
    ),
  });
  // 新規のときは名前からすぐ打てるようにする
  if (isNew) setTimeout(() => nameInput.focus(), 350);
}
