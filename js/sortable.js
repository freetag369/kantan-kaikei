// グリッド/リストのドラッグ並べ替え(Pointer Events ベース、タッチ・マウス共通)
//
// 使い方:
//   makeSortable(grid, {
//     itemSelector: '.cat-cell:not(.cat-cell-add)',
//     immediate: () => reorderMode,   // true なら押した瞬間からドラッグ開始
//     longPress: 450,                 // immediate でないとき、長押しでドラッグ開始(0で無効)
//     scrollEl,                       // 端に近づいたら自動スクロールする要素(要素 or それを返す関数)
//     onStart(item), onChange(ids), onEnd()
//   })
//
// 仕組み: つかんだセル自体はグリッドに残して半透明の「穴」にし、position:fixed の
// 分身(ghost)を指に追従させる。他のセルの上に来たら穴を DOM 上で移動し、
// 周囲のセルは FLIP で滑らかにずらす。離したら穴の位置に ghost を吸着させて終了。

const MOVE_CANCEL_PX = 10; // 長押し待ちの間にこれ以上動いたらスクロールとみなして中止
const EDGE_PX = 56; // 自動スクロールが効き始める端からの距離
const EDGE_SPEED = 9; // 自動スクロールの1フレームあたりの移動量

export function makeSortable(container, opts) {
  const {
    itemSelector,
    immediate = () => false,
    longPress = 450,
    scrollEl = null,
    onStart,
    onChange,
    onEnd,
  } = opts;

  let pressed = null; // {item, id, x, y, timer}
  let drag = null; // {item, ghost, offX, offY, x, y, raf, startOrder}
  let suppressClick = false;

  const items = () => [...container.querySelectorAll(itemSelector)];
  const order = () => items().map((n) => n.dataset.id);

  // ドラッグ直後の click でカテゴリー選択などが走らないようにする
  container.addEventListener(
    'click',
    (e) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    },
    true
  );
  // iOS の長押しメニュー抑止
  container.addEventListener('contextmenu', (e) => {
    if (pressed || drag) e.preventDefault();
  });

  container.addEventListener('pointerdown', (e) => {
    if (drag || pressed) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const item = e.target.closest(itemSelector);
    if (!item || !container.contains(item)) return;
    pressed = { item, id: e.pointerId, x: e.clientX, y: e.clientY, timer: null };
    if (immediate()) {
      begin(e);
    } else if (longPress > 0) {
      pressed.timer = setTimeout(() => {
        if (pressed && pressed.item === item) begin(e);
      }, longPress);
    }
  });

  container.addEventListener('pointermove', (e) => {
    if (drag) return move(e);
    if (pressed && pressed.id === e.pointerId) {
      const d = Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y);
      if (d > MOVE_CANCEL_PX) cancelPress();
    }
  });
  container.addEventListener('pointerup', (e) => (drag ? finish(e) : cancelPress()));
  container.addEventListener('pointercancel', (e) => (drag ? finish(e) : cancelPress()));
  // ghost の追従中にカーソルがグリッド外に出てもキャプチャで受け続ける
  container.addEventListener('lostpointercapture', () => {
    if (drag) finish();
  });

  function cancelPress() {
    if (pressed?.timer) clearTimeout(pressed.timer);
    pressed = null;
  }

  function preventTouch(e) {
    if (drag) e.preventDefault();
  }

  function begin(e) {
    const item = pressed.item;
    const pointerId = pressed.id;
    cancelPress();
    onStart?.(item);
    const rect = item.getBoundingClientRect();
    const ghost = item.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.classList.remove('selected', 'pop');
    Object.assign(ghost.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    document.body.append(ghost);
    item.classList.add('drag-placeholder');
    drag = {
      item,
      ghost,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      x: e.clientX,
      y: e.clientY,
      raf: 0,
      startOrder: order().join(','),
    };
    try {
      item.setPointerCapture(pointerId);
    } catch {
      /* 一部ブラウザでは capture 不可でも動く */
    }
    // 長押しからそのまま指を動かしたときに画面がスクロールしないようにする
    document.addEventListener('touchmove', preventTouch, { passive: false });
    navigator.vibrate?.(12);
    suppressClick = true;
    requestAnimationFrame(() => ghost.classList.add('lifted'));
    tick();
  }

  function move(e) {
    drag.x = e.clientX;
    drag.y = e.clientY;
    placeGhost();
    hitTest();
  }

  function placeGhost() {
    drag.ghost.style.left = `${drag.x - drag.offX}px`;
    drag.ghost.style.top = `${drag.y - drag.offY}px`;
  }

  // 自動スクロール + スクロール中も穴の位置を更新し続ける
  function tick() {
    if (!drag) return;
    const scroller = typeof scrollEl === 'function' ? scrollEl() : scrollEl;
    if (scroller) {
      const r = scroller.getBoundingClientRect();
      let dy = 0;
      if (drag.y < r.top + EDGE_PX) dy = -EDGE_SPEED * Math.min(1, (r.top + EDGE_PX - drag.y) / EDGE_PX + 0.3);
      else if (drag.y > r.bottom - EDGE_PX) dy = EDGE_SPEED * Math.min(1, (drag.y - (r.bottom - EDGE_PX)) / EDGE_PX + 0.3);
      if (dy) {
        const before = scroller.scrollTop;
        scroller.scrollTop += dy;
        if (scroller.scrollTop !== before) hitTest();
      }
    }
    drag.raf = requestAnimationFrame(tick);
  }

  function hitTest() {
    const { item, x, y } = drag;
    const list = items();
    const target = list.find((n) => {
      if (n === item) return false;
      const r = n.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    if (!target) return;
    const from = list.indexOf(item);
    const to = list.indexOf(target);
    if (from === to) return;
    const before = new Map(list.map((n) => [n, n.getBoundingClientRect()]));
    if (from < to) target.after(item);
    else target.before(item);
    // FLIP: 移動前の位置から新しい位置へ滑らせる
    for (const n of list) {
      if (n === item) continue;
      const a = before.get(n);
      const b = n.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (!dx && !dy) continue;
      n.style.transition = 'none';
      n.style.transform = `translate(${dx}px, ${dy}px)`;
      void n.offsetWidth;
      n.style.transition = '';
      n.style.transform = '';
    }
  }

  function finish() {
    if (!drag) return;
    const { item, ghost, raf, startOrder } = drag;
    drag = null;
    cancelAnimationFrame(raf);
    document.removeEventListener('touchmove', preventTouch);
    // ghost を穴の位置に吸着させてから消す
    const r = item.getBoundingClientRect();
    ghost.classList.remove('lifted');
    ghost.classList.add('settling');
    Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px` });
    setTimeout(() => {
      ghost.remove();
      item.classList.remove('drag-placeholder');
    }, 160);
    const ids = order();
    if (ids.join(',') !== startOrder) onChange?.(ids);
    onEnd?.();
  }

  return {
    destroy() {
      cancelPress();
      if (drag) finish();
    },
  };
}
