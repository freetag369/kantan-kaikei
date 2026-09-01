// カテゴリー/UI用のインラインSVG線画アイコン辞書
// すべて 24x24 viewBox、stroke: currentColor(カテゴリー色は親要素の color で指定)

const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

export const ICONS = {
  // ===== 支出系 =====
  food: `<circle cx="13.5" cy="12" r="6.5"/><circle cx="13.5" cy="12" r="2.8"/><path d="M4 4v6M2.5 4v3.5a1.5 1.5 0 0 0 3 0V4M4 10v10"/>`,
  bottle: `<path d="M9 3h4v3.2l2.6 2A2 2 0 0 1 16.4 9.8V19a2 2 0 0 1-2 2H8.6a2 2 0 0 1-2-2V9.8a2 2 0 0 1 .8-1.6L9 6.2Z"/><path d="M9 3h6.5M7 13h9.4"/>`,
  shirt: `<path d="M8.5 4 5 6.5l1.5 4L9 9.5V20h6V9.5l2.5 1 1.5-4L15.5 4a3.5 3.5 0 0 1-7 0Z"/>`,
  lipstick: `<path d="M10 11V5.5L14 4v7"/><rect x="9" y="11" width="6" height="4" rx="1"/><path d="M8 15h8v4a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19Z"/>`,
  cheers: `<path d="M7 3.5 4 5l2.5 6.5a2.6 2.6 0 0 0 3.4 1.5M17 3.5 20 5l-2.5 6.5a2.6 2.6 0 0 1-3.4 1.5"/><path d="M9 13.5 7.5 20M15 13.5 16.5 20M5.5 20.5h4M14.5 20.5h4"/><path d="M12 8.5v.01M11 5v.01M13.5 6.5v.01"/>`,
  pill: `<rect x="3" y="9.5" width="11" height="5.5" rx="2.75" transform="rotate(-30 8.5 12.2)"/><path d="M7.2 9.9l4.8 2.8"/><circle cx="16.5" cy="15.5" r="4"/><path d="M13 14.3l7 2.4"/>`,
  pencil: `<rect x="4" y="4" width="13" height="16" rx="2"/><path d="M7.5 4v16"/><path d="M19.5 8.5 13 15l-.6 3.1L15.5 17l6.5-6.5-2.5-2Z"/>`,
  faucet: `<path d="M12 8V5.5M9.5 5.5h5M4 12.5h4.5c0-2 1.5-4 3.5-4s3.5 2 3.5 4H20v3h-3c-1 0-1.5 1-1.5 1"/><path d="M4 11v3M11.5 18a1.6 1.6 0 0 0 3.2 0c0-1.2-1.6-3-1.6-3s-1.6 1.8-1.6 3Z"/>`,
  train: `<rect x="5" y="3.5" width="14" height="13.5" rx="3"/><path d="M5 9.5h14M9 3.5v6M15 3.5v6"/><circle cx="8.7" cy="13.5" r=".9"/><circle cx="15.3" cy="13.5" r=".9"/><path d="M8 17l-2 3.5M16 17l2 3.5M7.5 20.5h9"/>`,
  phone: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 4.5h3M11 18.5h2"/>`,
  house: `<path d="M4 10.5 12 4l8 6.5"/><path d="M5.5 9.5V20h13V9.5"/><rect x="9.5" y="13" width="5" height="7"/><path d="M9.5 16.5h5M12 13v7"/>`,
  cart: `<circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/><path d="M3.5 4.5H6l2.2 10.5h9.5L20.5 8H7"/>`,
  scissors: `<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8.2 8.3 20 17M8.2 15.7 20 7"/>`,
  book: `<path d="M4.5 5A2.5 2.5 0 0 1 7 2.5h12.5V18H7A2.5 2.5 0 0 0 4.5 20.5Z"/><path d="M4.5 5v15.5A2.5 2.5 0 0 1 7 18M19.5 18v3.5H7"/>`,
  game: `<path d="M7.5 7h9a5.5 5.5 0 0 1 5 7.8 2.8 2.8 0 0 1-4.7.8L15 13.5H9L7.2 15.6a2.8 2.8 0 0 1-4.7-.8A5.5 5.5 0 0 1 7.5 7Z"/><path d="M8.5 9.7v3M7 11.2h3M15.5 10v.01M17.5 11.5v.01"/>`,
  heart: `<path d="M12 20s-7.5-4.6-9-9.3C2 7.6 4 4.9 7 4.9c2 0 3.6 1.2 5 3.1 1.4-1.9 3-3.1 5-3.1 3 0 5 2.7 4 5.8-1.5 4.7-9 9.3-9 9.3Z"/>`,
  paw: `<circle cx="7" cy="8.5" r="1.8"/><circle cx="12" cy="6.5" r="1.8"/><circle cx="17" cy="8.5" r="1.8"/><path d="M8 15.5c0-2.2 1.8-4 4-4s4 1.8 4 4c1.5.5 2.5 1.6 2.5 3 0 1.7-1.3 2.5-3 2.5-1.2 0-2.3-.5-3.5-.5s-2.3.5-3.5.5c-1.7 0-3-.8-3-2.5 0-1.4 1-2.5 2.5-3Z"/>`,
  car: `<path d="M5 13 6.5 8a2 2 0 0 1 1.9-1.5h7.2A2 2 0 0 1 17.5 8L19 13"/><rect x="3.5" y="13" width="17" height="5.5" rx="1.5"/><path d="M5.5 18.5v2M18.5 18.5v2"/><circle cx="7.5" cy="15.7" r=".9"/><circle cx="16.5" cy="15.7" r=".9"/>`,
  // ===== ビジネス系 =====
  box: `<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16Z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8"/>`,
  briefcase: `<rect x="3.5" y="7.5" width="17" height="12.5" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17M12 11.5v2.5"/>`,
  users: `<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="16.8" cy="9" r="2.4"/><path d="M16.5 14.7c2.3.3 4 2 4 4.3"/>`,
  megaphone: `<path d="M4 10v4a1 1 0 0 0 1 1h2l9 4.5V4.5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M19 10a3 3 0 0 1 0 4M8 15.5l1 5h2.5l-.8-4.7"/>`,
  building: `<rect x="5.5" y="3.5" width="10" height="17"/><path d="M15.5 9.5h3.5v11h-3.5M3.5 20.5h18"/><path d="M8.5 7h1.5M11.5 7H13M8.5 10.5h1.5M11.5 10.5H13M8.5 14h1.5M11.5 14H13"/>`,
  chart: `<path d="M4 4v16h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/>`,
  plane: `<path d="M10.5 13.5 4 11l1.5-1.5 6 .5 4.5-4.5c.8-.8 2-.8 2.5-.3s.5 1.7-.3 2.5L13.7 12l.5 6L12.5 20l-2.5-6.5-2.7 2.2.2 2.3-1.2 1.2-1.5-3-3-1.5 1.2-1.2 2.3.2Z"/>`,
  // ===== 収入系 =====
  money: `<rect x="3" y="6.5" width="18" height="11" rx="1.8"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v.01M18 14.5v.01"/>`,
  gift: `<rect x="4" y="9" width="16" height="4"/><path d="M5.5 13v7.5h13V13M12 9v11.5"/><path d="M12 9S9 9 7.8 7.8a1.9 1.9 0 0 1 2.7-2.7C11.7 6.3 12 9 12 9ZM12 9s3 0 4.2-1.2a1.9 1.9 0 0 0-2.7-2.7C12.3 6.3 12 9 12 9Z"/>`,
  coin: `<circle cx="12" cy="12" r="8.5"/><path d="M9 8l3 4.5L15 8M12 12.5V17M9.7 13.5h4.6M9.7 15.5h4.6"/>`,
  piggy: `<path d="M5.5 12a6.5 6.5 0 0 1 6.5-6c3 0 5.3 1.3 6.3 3.5H20a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.2c-.4 1-1.1 1.9-2 2.5V19a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.6h-2.6v.6a1 1 0 0 1-1 1H8.2a1 1 0 0 1-1-1v-2c-1-.8-1.6-2-1.7-3.2H4a1.2 1.2 0 0 1 0-2.4Z"/><circle cx="15.5" cy="11" r=".5"/><path d="M9.5 8.8c1.5-.6 3.5-.6 5 0"/>`,
  // ===== UI用 =====
  wallet: `<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 9.5h13a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3M16.5 6V4.8a1.3 1.3 0 0 0-1.6-1.2L4 6"/><circle cx="16" cy="11.5" r=".6"/>`,
  card: `<rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><path d="M2.5 9.5h19M6 15h4"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h1M11.5 13h1M15.5 13h1M7.5 17h1M11.5 17h1M15.5 17h1"/>`,
  pie: `<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12Z"/><path d="M14.5 2.5a8 8 0 0 1 7 7h-7Z"/>`,
  edit: `<path d="m16.8 3.8 3.4 3.4L8.5 18.9 4 20l1.1-4.5Z"/>`,
  ellipsis: `<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>`,
  chevronL: `<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>`,
  chevronR: `<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>`,
  chevron: `<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  trash: `<path d="M4.5 6.5h15M9.5 6.5V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 6.5 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12.5"/><path d="M10 10.5v6M14 10.5v6"/>`,
  download: `<path d="M12 4v11M7.5 11 12 15.5 16.5 11M4.5 19.5h15"/>`,
  upload: `<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M4.5 19.5h15"/>`,
  swap: `<path d="M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7"/>`,
  balance: `<path d="M4 19.5h16M6 19.5V12M10 19.5V8M14 19.5v-7M18 19.5V5"/><path d="M4.5 9.5 10 5l4 3.5 5.5-4"/>`,
  person: `<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18"/>`,
  info: `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.7v.01"/>`,
  yensign: `<path d="M7 4l5 7 5-7M12 11v8M8.5 13.5h7M8.5 16.5h7"/>`,
};

export function svgIcon(name, cls = '') {
  const body = ICONS[name] || ICONS.cart;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" ${S} aria-hidden="true">${body}</svg>`;
}

// カテゴリー編集で選べるアイコン一覧
export const PICKABLE_ICONS = [
  'food', 'bottle', 'shirt', 'lipstick', 'cheers', 'pill', 'pencil', 'faucet',
  'train', 'phone', 'house', 'cart', 'scissors', 'book', 'game', 'heart',
  'paw', 'car', 'box', 'briefcase', 'users', 'megaphone', 'building', 'chart',
  'plane', 'money', 'gift', 'coin', 'piggy', 'wallet', 'card', 'balance',
];

// カテゴリー用カラーパレット
export const PALETTE = [
  '#f2792f', '#e8973a', '#e0b52a', '#3fae5a', '#59c98f', '#14b8a6',
  '#4db5e8', '#3b82f6', '#3b5bd6', '#8b5cf6', '#e85daa', '#e05252',
  '#8a6b4d', '#6b7280',
];

// プロフィール(事業)用アクセント配色プリセット
// css の html[data-accent='...'] と1:1で対応する。追加する場合はCSS側も
// ライト/ダーク両方に定義すること(ダークを書き忘れると詳細度でライトが勝つ)
export const ACCENTS = ['orange', 'teal', 'blue', 'green', 'purple', 'pink', 'brown', 'red'];

// 設定画面のスウォッチ表示用(ライトテーマの基準色)
export const ACCENT_HEX = {
  orange: '#ee821c',
  teal: '#0ea89b',
  blue: '#3b82f6',
  green: '#3fae5a',
  purple: '#8b5cf6',
  pink: '#e85daa',
  brown: '#8a6b4d',
  red: '#e05252',
};
