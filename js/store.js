// localStorage 永続化・スキーマ・シード・マイグレーション・セレクタ
import { uid, monthOf, addMonths } from './utils.js';
import { ACCENTS } from './icons.js';

const PREFIX = 'kk:';
const SCHEMA_VERSION = 3;
export const APP_ID = 'kantan-kaikei';

const KEYS = ['meta', 'profiles', 'paymentMethods', 'categories', 'transactions', 'budgets', 'settings'];

let db = {};

function readKey(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey(key) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(db[key]));
  } catch (e) {
    console.error('保存に失敗しました', e);
    alert('データの保存に失敗しました。ストレージの空き容量を確認してください。');
  }
}

// ================= 初期データ =================

const PERSONAL_EXPENSE = [
  ['食費', 'food', '#f2792f'],
  ['日用品', 'bottle', '#3fae5a'],
  ['衣服', 'shirt', '#3b5bd6'],
  ['美容', 'lipstick', '#e85daa'],
  ['交際費', 'cheers', '#e0b52a'],
  ['医療費', 'pill', '#59c98f'],
  ['教育費', 'pencil', '#e05252'],
  ['光熱費', 'faucet', '#4db5e8'],
  ['交通費', 'train', '#8a6b4d'],
  ['通信費', 'phone', '#6b7280'],
  ['住居費', 'house', '#e8973a'],
  ['その他', 'cart', '#e0b52a'],
];
const PERSONAL_INCOME = [
  ['給料', 'money', '#3b82f6'],
  ['賞与', 'gift', '#e8973a'],
  ['副収入', 'briefcase', '#3fae5a'],
  ['その他', 'coin', '#6b7280'],
];
const BUSINESS_EXPENSE = [
  ['仕入', 'box', '#8a6b4d'],
  ['消耗品費', 'bottle', '#3fae5a'],
  ['旅費交通費', 'train', '#4db5e8'],
  ['通信費', 'phone', '#6b7280'],
  ['接待交際費', 'cheers', '#e0b52a'],
  ['外注費', 'users', '#3b5bd6'],
  ['広告宣伝費', 'megaphone', '#e85daa'],
  ['水道光熱費', 'faucet', '#59c98f'],
  ['地代家賃', 'building', '#e8973a'],
  ['雑費', 'cart', '#e05252'],
];
const BUSINESS_INCOME = [
  ['売上', 'chart', '#14b8a6'],
  ['雑収入', 'coin', '#6b7280'],
];

// 事業を追加するときに選べる初期カテゴリーのテンプレート
const CATEGORY_TEMPLATES = {
  business: { expense: BUSINESS_EXPENSE, income: BUSINESS_INCOME },
  personal: { expense: PERSONAL_EXPENSE, income: PERSONAL_INCOME },
  empty: { expense: [], income: [] },
};

// まだ使われていないアクセント色を優先して割り当てる
function nextAccent(profiles) {
  const used = new Set(profiles.map((p) => p.accent));
  return ACCENTS.find((a) => !used.has(a)) || ACCENTS[profiles.length % ACCENTS.length];
}

function makeCategories(profileId, type, defs) {
  return defs.map(([name, icon, color], i) => ({
    id: uid() + i.toString(36),
    profileId,
    type,
    name,
    icon,
    color,
    sortOrder: i,
    archived: false,
  }));
}

function seed() {
  const now = new Date().toISOString();
  db.meta = { schemaVersion: SCHEMA_VERSION, activeProfileId: 'personal', createdAt: now, updatedAt: now };
  db.profiles = [
    { id: 'personal', name: '個人', accent: 'orange', kind: 'personal', sortOrder: 0 },
    { id: 'business', name: 'フリータッグ', accent: 'teal', kind: 'business', sortOrder: 1 },
    { id: 'business2', name: 'その他事業', accent: 'blue', kind: 'business', sortOrder: 2 },
  ];
  db.paymentMethods = [
    { id: uid(), name: '現金', sortOrder: 0, archived: false },
  ];
  db.categories = [
    ...makeCategories('personal', 'expense', PERSONAL_EXPENSE),
    ...makeCategories('personal', 'income', PERSONAL_INCOME),
    ...makeCategories('business', 'expense', BUSINESS_EXPENSE),
    ...makeCategories('business', 'income', BUSINESS_INCOME),
    ...makeCategories('business2', 'expense', BUSINESS_EXPENSE),
    ...makeCategories('business2', 'income', BUSINESS_INCOME),
  ];
  db.transactions = [];
  db.budgets = {};
  db.settings = {};
  KEYS.forEach(writeKey);
}

// ================= マイグレーション =================

// v1 時代の2プロフィールに割り当てる既定アクセント
const V1_DEFAULT_ACCENT = { personal: 'orange', business: 'teal' };

const migrations = {
  // v2: 複数事業対応。profileId は一切書き換えないので、既存の取引・カテゴリー・
  //     予算はそのまま引き継がれる。表示名だけを変え、3件目の事業を追加する。
  2: (data) => {
    if (!Array.isArray(data.profiles)) data.profiles = [];
    if (!Array.isArray(data.categories)) data.categories = [];

    data.profiles.forEach((p, i) => {
      if (!p.accent) p.accent = V1_DEFAULT_ACCENT[p.id] || ACCENTS[i % ACCENTS.length];
      if (!p.kind) p.kind = p.id === 'personal' ? 'personal' : 'business';
      if (typeof p.sortOrder !== 'number') p.sortOrder = i;
    });

    // 既定名のままの「ビジネス」だけ改名する(利用者が改名済みなら尊重)
    const biz = data.profiles.find((p) => p.id === 'business');
    if (biz && biz.name === 'ビジネス') biz.name = 'フリータッグ';

    // 「その他事業」を追加(v1 のプロフィールはちょうど2件)
    if (data.profiles.length === 2 && biz && !data.profiles.some((p) => p.id === 'business2')) {
      data.profiles.push({ id: 'business2', name: 'その他事業', accent: 'blue', kind: 'business', sortOrder: 2 });
      data.categories.push(
        ...makeCategories('business2', 'expense', BUSINESS_EXPENSE),
        ...makeCategories('business2', 'income', BUSINESS_INCOME)
      );
    }

    // アクティブなプロフィールが存在しないケースの保険
    if (data.meta && !data.profiles.some((p) => p.id === data.meta.activeProfileId)) {
      data.meta.activeProfileId = data.profiles[0]?.id || 'personal';
    }
  },
  // v3: 振替(type:'transfer', fromPaymentMethodId/toPaymentMethodId)を追加。
  //     既存データの書き換えは不要。旧バージョンが振替入りバックアップを拒否できるよう番号だけ進める。
  3: () => {},
};

function migrate(data) {
  let v = data.meta?.schemaVersion || 1;
  while (v < SCHEMA_VERSION) {
    v++;
    if (migrations[v]) migrations[v](data);
    data.meta.schemaVersion = v;
  }
  return data;
}

// ================= 初期化 =================

export function initStore() {
  const meta = readKey('meta', null);
  if (!meta) {
    seed();
    return;
  }
  for (const k of KEYS) db[k] = readKey(k, k === 'budgets' || k === 'settings' || k === 'meta' ? {} : []);
  db.meta = meta;
  migrate(db);
  KEYS.forEach(writeKey);
  navigator.storage?.persist?.().catch(() => {});
}

function touch() {
  db.meta.updatedAt = new Date().toISOString();
  writeKey('meta');
}

// ================= プロフィール =================

// sortOrder 昇順の配列を返す(要素は生オブジェクトなので更新はそのまま反映される)
export function getProfiles() {
  return db.profiles.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getProfile(id) {
  return db.profiles.find((p) => p.id === id);
}

export function getActiveProfileId() {
  return db.meta.activeProfileId;
}

export function setActiveProfileId(id) {
  db.meta.activeProfileId = id;
  touch();
}

export function updateProfile(id, patch) {
  const p = getProfile(id);
  if (!p) return;
  Object.assign(p, patch);
  writeKey('profiles');
  touch();
}

// template: 'business' | 'personal' | 'empty'
// copyFromProfileId を渡すと、そのプロフィールのカテゴリー定義だけを複製する(取引は複製しない)
export function addProfile({ name, accent, kind = 'business', template = 'business', copyFromProfileId = null }) {
  const p = {
    id: uid(),
    name,
    accent: accent || nextAccent(db.profiles),
    kind,
    sortOrder: db.profiles.length ? Math.max(...db.profiles.map((x) => x.sortOrder ?? 0)) + 1 : 0,
  };
  db.profiles.push(p);

  if (copyFromProfileId && getProfile(copyFromProfileId)) {
    for (const type of ['expense', 'income']) {
      getCategories(copyFromProfileId, type).forEach((c, i) => {
        db.categories.push({ ...c, id: uid() + i.toString(36), profileId: p.id, archived: false });
      });
    }
  } else {
    const t = CATEGORY_TEMPLATES[template] || CATEGORY_TEMPLATES.business;
    db.categories.push(
      ...makeCategories(p.id, 'expense', t.expense),
      ...makeCategories(p.id, 'income', t.income)
    );
  }

  writeKey('profiles');
  writeKey('categories');
  touch();
  return p;
}

// 削除確認ダイアログに件数を出すため
export function profileStats(id) {
  return {
    transactions: db.transactions.filter((t) => t.profileId === id).length,
    categories: db.categories.filter((c) => c.profileId === id).length,
    budgets: Object.keys(db.budgets).filter((k) => k.startsWith(id + '|')).length,
  };
}

// プロフィール削除 = その事業の帳簿(取引・カテゴリー・予算)を丸ごと物理削除。
// 支払い方法は全事業共通なので触らない。最後の1件は削除できない。
export function removeProfile(id) {
  if (db.profiles.length <= 1 || !getProfile(id)) return false;
  db.profiles = db.profiles.filter((p) => p.id !== id);
  db.transactions = db.transactions.filter((t) => t.profileId !== id);
  db.categories = db.categories.filter((c) => c.profileId !== id);
  for (const k of Object.keys(db.budgets)) {
    if (k.startsWith(id + '|')) delete db.budgets[k];
  }
  getProfiles().forEach((p, i) => (p.sortOrder = i)); // 並び順を詰める
  if (db.meta.activeProfileId === id) db.meta.activeProfileId = getProfiles()[0].id;
  ['profiles', 'transactions', 'categories', 'budgets'].forEach(writeKey);
  touch();
  return true;
}

export function moveProfile(id, dir) {
  const list = getProfiles();
  const idx = list.findIndex((p) => p.id === id);
  const p = list[idx];
  const swapWith = list[idx + dir];
  if (!p || !swapWith) return;
  [p.sortOrder, swapWith.sortOrder] = [swapWith.sortOrder, p.sortOrder];
  writeKey('profiles');
  touch();
}

// ================= カテゴリー =================

export function getCategories(profileId, type, { includeArchived = false } = {}) {
  return db.categories
    .filter((c) => c.profileId === profileId && c.type === type && (includeArchived || !c.archived))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryById(id) {
  return db.categories.find((c) => c.id === id);
}

export function addCategory(profileId, type, { name, icon, color }) {
  const list = getCategories(profileId, type, { includeArchived: true });
  const cat = {
    id: uid(),
    profileId,
    type,
    name,
    icon,
    color,
    sortOrder: list.length ? Math.max(...list.map((c) => c.sortOrder)) + 1 : 0,
    archived: false,
  };
  db.categories.push(cat);
  writeKey('categories');
  touch();
  return cat;
}

export function updateCategory(id, patch) {
  const c = getCategoryById(id);
  if (c) {
    Object.assign(c, patch);
    writeKey('categories');
    touch();
  }
}

export function categoryInUse(id) {
  return db.transactions.some((t) => t.categoryId === id);
}

// 取引で使用中なら archived、未使用なら物理削除
export function removeCategory(id) {
  if (categoryInUse(id)) {
    updateCategory(id, { archived: true });
    return 'archived';
  }
  db.categories = db.categories.filter((c) => c.id !== id);
  // 予算からも削除
  for (const key of Object.keys(db.budgets)) {
    if (key.endsWith('|' + id)) delete db.budgets[key];
  }
  writeKey('categories');
  writeKey('budgets');
  touch();
  return 'deleted';
}

export function moveCategory(id, dir) {
  const c = getCategoryById(id);
  if (!c) return;
  const list = getCategories(c.profileId, c.type);
  const idx = list.findIndex((x) => x.id === id);
  const swapWith = list[idx + dir];
  if (!swapWith) return;
  [c.sortOrder, swapWith.sortOrder] = [swapWith.sortOrder, c.sortOrder];
  writeKey('categories');
  touch();
}

// ================= 支払い方法(プロフィール共通) =================

export function getPaymentMethods({ includeArchived = false } = {}) {
  return db.paymentMethods
    .filter((m) => includeArchived || !m.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPaymentMethodById(id) {
  return db.paymentMethods.find((m) => m.id === id);
}

export function addPaymentMethod(name) {
  const m = {
    id: uid(),
    name,
    sortOrder: db.paymentMethods.length ? Math.max(...db.paymentMethods.map((x) => x.sortOrder)) + 1 : 0,
    archived: false,
  };
  db.paymentMethods.push(m);
  writeKey('paymentMethods');
  touch();
  return m;
}

export function updatePaymentMethod(id, patch) {
  const m = getPaymentMethodById(id);
  if (m) {
    Object.assign(m, patch);
    writeKey('paymentMethods');
    touch();
  }
}

export function paymentMethodInUse(id) {
  return db.transactions.some(
    (t) => t.paymentMethodId === id || t.fromPaymentMethodId === id || t.toPaymentMethodId === id
  );
}

export function removePaymentMethod(id) {
  if (paymentMethodInUse(id)) {
    updatePaymentMethod(id, { archived: true });
    return 'archived';
  }
  db.paymentMethods = db.paymentMethods.filter((m) => m.id !== id);
  writeKey('paymentMethods');
  touch();
  return 'deleted';
}

export function movePaymentMethod(id, dir) {
  const list = getPaymentMethods();
  const idx = list.findIndex((x) => x.id === id);
  const m = list[idx];
  const swapWith = list[idx + dir];
  if (!m || !swapWith) return;
  [m.sortOrder, swapWith.sortOrder] = [swapWith.sortOrder, m.sortOrder];
  writeKey('paymentMethods');
  touch();
}

// 支払い方法ごとの残高 → Map<methodId, {balance, charged}>
// 支払い方法はプロフィール共通なので全プロフィールの取引を横断して計算する。
// charged: 振替の受け取り先になったことがある(=残高を表示する価値がある)方法
export function getPaymentMethodBalances() {
  const map = new Map();
  const entry = (id) => {
    if (!map.has(id)) map.set(id, { balance: 0, charged: false });
    return map.get(id);
  };
  for (const t of db.transactions) {
    if (t.type === 'transfer') {
      if (t.fromPaymentMethodId) entry(t.fromPaymentMethodId).balance -= t.amount;
      if (t.toPaymentMethodId) {
        const e = entry(t.toPaymentMethodId);
        e.balance += t.amount;
        e.charged = true;
      }
    } else if (t.paymentMethodId) {
      entry(t.paymentMethodId).balance += t.type === 'income' ? t.amount : -t.amount;
    }
  }
  return map;
}

// ================= 取引 =================

export function addTransaction({ profileId, type, date, amount, categoryId, paymentMethodId, fromPaymentMethodId, toPaymentMethodId, memo }) {
  const now = new Date().toISOString();
  const tx = {
    id: uid(),
    profileId,
    type,
    date,
    amount,
    categoryId: categoryId || null,
    paymentMethodId: paymentMethodId || null,
    fromPaymentMethodId: fromPaymentMethodId || null,
    toPaymentMethodId: toPaymentMethodId || null,
    memo: memo || '',
    createdAt: now,
    updatedAt: now,
  };
  db.transactions.push(tx);
  writeKey('transactions');
  touch();
  return tx;
}

export function updateTransaction(id, patch) {
  const t = db.transactions.find((x) => x.id === id);
  if (t) {
    Object.assign(t, patch, { updatedAt: new Date().toISOString() });
    writeKey('transactions');
    touch();
  }
}

export function deleteTransaction(id) {
  db.transactions = db.transactions.filter((t) => t.id !== id);
  writeKey('transactions');
  touch();
}

export function getTransaction(id) {
  return db.transactions.find((t) => t.id === id);
}

// フィルタ付き取得(常にプロフィールで絞る)
export function getTransactions(profileId, { type, from, to, month, year, categoryId, paymentMethodId, keyword } = {}) {
  let list = db.transactions.filter((t) => t.profileId === profileId);
  if (type) list = list.filter((t) => t.type === type);
  if (month) list = list.filter((t) => monthOf(t.date) === month);
  if (year) list = list.filter((t) => t.date.startsWith(year + '-'));
  if (from) list = list.filter((t) => t.date >= from);
  if (to) list = list.filter((t) => t.date <= to);
  if (categoryId) list = list.filter((t) => t.categoryId === categoryId);
  if (paymentMethodId) {
    list = list.filter(
      (t) => t.paymentMethodId === paymentMethodId || t.fromPaymentMethodId === paymentMethodId || t.toPaymentMethodId === paymentMethodId
    );
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    list = list.filter((t) => {
      const cat = getCategoryById(t.categoryId);
      return (
        (t.memo && t.memo.toLowerCase().includes(kw)) ||
        (cat && cat.name.toLowerCase().includes(kw))
      );
    });
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
}

// 集計: {income, expense} 合計(振替は収支に含めない)
export function sumTransactions(txs) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

// カテゴリー別集計 → [{category, total, count}] 降順
export function groupByCategory(txs) {
  const map = new Map();
  for (const t of txs) {
    const e = map.get(t.categoryId) || { total: 0, count: 0 };
    e.total += t.amount;
    e.count++;
    map.set(t.categoryId, e);
  }
  return [...map.entries()]
    .map(([categoryId, e]) => ({ category: getCategoryById(categoryId), ...e }))
    .sort((a, b) => b.total - a.total);
}

// 支払い方法別集計 → [{method, total, count}] 降順(方法未設定は method:null)
export function groupByPaymentMethod(txs) {
  const map = new Map();
  for (const t of txs) {
    const key = t.paymentMethodId || '__none__';
    const e = map.get(key) || { total: 0, count: 0 };
    e.total += t.amount;
    e.count++;
    map.set(key, e);
  }
  return [...map.entries()]
    .map(([key, e]) => ({ method: key === '__none__' ? null : getPaymentMethodById(key), ...e }))
    .sort((a, b) => b.total - a.total);
}

// 存在する取引の年リスト(昇順)
export function getYears(profileId) {
  const set = new Set(db.transactions.filter((t) => t.profileId === profileId).map((t) => t.date.slice(0, 4)));
  return [...set].sort();
}

// ================= 予算 =================

export const BUDGET_TOTAL = '__total__';

function budgetKey(profileId, month, categoryId) {
  return `${profileId}|${month}|${categoryId}`;
}

function monthHasBudget(profileId, month) {
  const prefix = `${profileId}|${month}|`;
  return Object.keys(db.budgets).some((k) => k.startsWith(prefix));
}

// その月の予算マップ {categoryId: amount}。未設定月は直近24ヶ月以内の設定月から引き継ぎ
export function getEffectiveBudgets(profileId, month) {
  let src = month;
  if (!monthHasBudget(profileId, month)) {
    let m = month;
    src = null;
    for (let i = 0; i < 24; i++) {
      m = addMonths(m, -1);
      if (monthHasBudget(profileId, m)) {
        src = m;
        break;
      }
    }
    if (!src) return { map: {}, inherited: false };
  }
  const prefix = `${profileId}|${src}|`;
  const map = {};
  for (const [k, v] of Object.entries(db.budgets)) {
    if (k.startsWith(prefix)) map[k.slice(prefix.length)] = v;
  }
  return { map, inherited: src !== month };
}

// 予算を設定(amount=null で削除)。引き継ぎ表示中の初編集時は引き継ぎ元を月にコピーしてから適用
export function setBudget(profileId, month, categoryId, amount) {
  const { map, inherited } = getEffectiveBudgets(profileId, month);
  if (inherited) {
    for (const [cid, v] of Object.entries(map)) {
      db.budgets[budgetKey(profileId, month, cid)] = v;
    }
  }
  const key = budgetKey(profileId, month, categoryId);
  if (amount === null || amount === 0) delete db.budgets[key];
  else db.budgets[key] = amount;
  writeKey('budgets');
  touch();
}

// ================= エクスポート / インポート =================

export function exportData() {
  return JSON.stringify(
    {
      app: APP_ID,
      schemaVersion: db.meta.schemaVersion,
      exportedAt: new Date().toISOString(),
      data: db,
    },
    null,
    2
  );
}

export function importData(json) {
  const parsed = JSON.parse(json);
  if (parsed.app !== APP_ID || !parsed.data || !parsed.data.meta) {
    throw new Error('このアプリのバックアップファイルではありません。');
  }
  if ((parsed.schemaVersion || 1) > SCHEMA_VERSION) {
    throw new Error('新しいバージョンのアプリで作成されたファイルのため読み込めません。');
  }
  db = parsed.data;
  migrate(db);
  KEYS.forEach(writeKey);
}

export function countAll() {
  return {
    transactions: db.transactions.length,
    categories: db.categories.length,
    paymentMethods: db.paymentMethods.length,
  };
}
