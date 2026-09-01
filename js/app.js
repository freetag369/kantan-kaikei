// エントリポイント: 初期化・タブルーター
import { $, $$ } from './utils.js';
import { state, setState, on } from './state.js';
import * as store from './store.js';
import { initInputView } from './views/input.js';
import { initCalendarView } from './views/calendar.js';
import { initReportView } from './views/report.js';
import { initBudgetView } from './views/budget.js';
import { initMenuView } from './views/menu.js';
import { applyAccent } from './components.js';

store.initStore();
state.activeProfileId = store.getActiveProfileId();
applyAccent(state.activeProfileId);

// ビュー初期化
initInputView($('#view-input'));
initCalendarView($('#view-calendar'));
initReportView($('#view-report'));
initBudgetView($('#view-budget'));
initMenuView($('#view-menu'));

// タブ切替
const tabbar = $('#tabbar');
function showTab(tab) {
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${tab}`));
  $$('.tab-btn', tabbar).forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
}

tabbar.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  setState({ tab: btn.dataset.tab }, 'tab');
});

on('tab', () => showTab(state.tab));
showTab(state.tab);

// Service Worker 登録(localhost/https のみ)
const isDevHost = location.hostname === 'localhost';
if ('serviceWorker' in navigator && !isDevHost) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      reg.update().catch(() => {});
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  });
}

// iOSのピンチズーム抑止(スタンドアロン時)
document.addEventListener('gesturestart', (e) => e.preventDefault());
