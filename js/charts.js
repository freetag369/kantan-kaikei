// SVG チャート描画(ライブラリ不使用)
import { el, num } from './utils.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// ドーナツ円グラフ
// items: [{label, value, color}] / centerLabel: 中央の小見出し / centerValue: 中央の値
export function donutChart(items, { size = 210, centerLabel = '', centerValue = '' } = {}) {
  const total = items.reduce((s, x) => s + x.value, 0);
  const wrap = el('div', { class: 'donut-wrap' });
  const svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'donut', width: size, height: size });

  const r = 38;
  const cx = 50;
  const cy = 50;
  const strokeW = 16;
  const circumference = 2 * Math.PI * r;

  if (total <= 0) {
    svg.append(
      svgEl('circle', { cx, cy, r, fill: 'none', stroke: 'var(--track)', 'stroke-width': strokeW })
    );
  } else {
    // 下地
    svg.append(svgEl('circle', { cx, cy, r, fill: 'none', stroke: 'var(--track)', 'stroke-width': strokeW }));
    let offset = 0;
    items.forEach((item, i) => {
      const frac = item.value / total;
      const seg = svgEl('circle', {
        cx,
        cy,
        r,
        fill: 'none',
        stroke: item.color,
        'stroke-width': strokeW,
        'stroke-dasharray': `${frac * circumference} ${circumference}`,
        'stroke-dashoffset': -offset * circumference,
        transform: `rotate(-90 ${cx} ${cy})`,
        class: 'donut-seg',
        style: `--delay:${i * 60}ms`,
      });
      svg.append(seg);
      // 割合ラベル(8%以上のセグメントのみ)
      if (frac >= 0.08) {
        const mid = (offset + frac / 2) * 2 * Math.PI - Math.PI / 2;
        const lr = r; // ストローク中心
        const tx = cx + Math.cos(mid) * lr;
        const ty = cy + Math.sin(mid) * lr;
        const label = svgEl('text', {
          x: tx,
          y: ty,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          class: 'donut-label',
        });
        label.textContent = `${Math.round(frac * 100)}%`;
        svg.append(label);
      }
      offset += frac;
    });
  }

  const center = el(
    'div',
    { class: 'donut-center' },
    centerLabel ? el('div', { class: 'donut-center-label' }, centerLabel) : null,
    centerValue ? el('div', { class: 'donut-center-value' }, centerValue) : null
  );
  wrap.append(svg, center);
  return wrap;
}

// 横並び棒グラフ(月別/年別の収支)
// items: [{label, income, expense}]
export function barChart(items, { height = 180 } = {}) {
  const max = Math.max(1, ...items.map((x) => Math.max(x.income, x.expense)));
  const wrap = el('div', { class: 'barchart', style: `--h:${height}px` });
  for (const item of items) {
    const incH = Math.round((item.income / max) * 100);
    const expH = Math.round((item.expense / max) * 100);
    wrap.append(
      el(
        'div',
        { class: 'barchart-col' },
        el(
          'div',
          { class: 'barchart-bars' },
          el('div', { class: 'barchart-bar income', style: `--v:${incH}%`, title: `収入 ${num(item.income)}円` }),
          el('div', { class: 'barchart-bar expense', style: `--v:${expH}%`, title: `支出 ${num(item.expense)}円` })
        ),
        el('div', { class: 'barchart-label' }, item.label)
      )
    );
  }
  return wrap;
}

// 残高推移(累積収支)の縦棒グラフ。負値対応
// items: [{label, value}]
export function balanceChart(items, { height = 200 } = {}) {
  const maxV = Math.max(0, ...items.map((x) => x.value));
  const minV = Math.min(0, ...items.map((x) => x.value));
  const range = Math.max(1, maxV - minV);
  const zeroPct = (maxV / range) * 100; // 上端からゼロラインまでの%

  const wrap = el('div', { class: 'balchart', style: `--h:${height}px; --zero:${zeroPct}%` });
  const inner = el('div', { class: 'balchart-inner' });
  inner.append(el('div', { class: 'balchart-zero' }));
  for (const item of items) {
    const hPct = (Math.abs(item.value) / range) * 100;
    const topPct = item.value >= 0 ? zeroPct - hPct : zeroPct;
    inner.append(
      el(
        'div',
        { class: 'balchart-col', title: `${item.label}: ${num(item.value)}円` },
        el('div', {
          class: `balchart-bar ${item.value >= 0 ? 'pos' : 'neg'}`,
          style: `top:${topPct}%; --v:${Math.max(hPct, 0.6)}%`,
        }),
        el('div', { class: 'balchart-label' }, item.label)
      )
    );
  }
  wrap.append(inner);
  return wrap;
}

// 進捗バー(予算)
export function progressBar(ratio, { over = false } = {}) {
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return el(
    'div',
    { class: `progress${over ? ' over' : ''}` },
    el('div', { class: 'progress-fill', style: `--v:${pct}%` })
  );
}

// カテゴリーリスト用の割合バー
export function ratioBar(ratio, color) {
  return el(
    'div',
    { class: 'ratio-bar' },
    el('div', { class: 'ratio-fill', style: `--v:${Math.min(100, ratio * 100)}%; background:${color}` })
  );
}
