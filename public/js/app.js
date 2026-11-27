(function () {
  const { store, calendar, render: R, modals, icon, cvar, uid, toast } = App;

  const boardsEl = document.getElementById('boards');
  const openBoards = new Set();
  const openItems = new Set();
  let hovered = null; // {b, i, s} of the subtask the pointer / focus is on

  /* ---------- render ---------- */

  function snapshotDrafts() {
    const drafts = new Map();
    boardsEl.querySelectorAll('form.add-sub').forEach((f) => {
      const vals = ['title', 'start', 'end'].map((n) => f.elements[n].value);
      if (vals.some(Boolean)) drafts.set(f.closest('.item').dataset.i, vals);
    });
    const a = document.activeElement;
    const focusItem = a && a.closest && a.closest('form.add-sub') ? a.closest('.item').dataset.i : null;
    return { drafts, focusItem, focusName: focusItem ? a.name : null };
  }

  function render(focusTitleOf) {
    const snap = snapshotDrafts();
    const d = store.data;
    boardsEl.innerHTML = d.boards.map((b, i) => R.board(b, i, openBoards, openItems)).join('') + R.addBoard();
    document.getElementById('stats').innerHTML = R.stats(d);

    snap.drafts.forEach((vals, iid) => {
      const f = boardsEl.querySelector(`.item[data-i="${CSS.escape(iid)}"] form.add-sub`);
      if (f) ['title', 'start', 'end'].forEach((n, k) => { f.elements[n].value = vals[k]; });
    });
    const focusId = focusTitleOf || snap.focusItem;
    if (focusId) {
      const f = boardsEl.querySelector(`.item[data-i="${CSS.escape(focusId)}"] form.add-sub`);
      if (f) f.elements[focusTitleOf ? 'title' : snap.focusName || 'title'].focus();
    }

    calendar.setData(d);
    refreshHover();
  }

  /* ---------- calendar preview on hover ---------- */

  function previewOf(h) {
    const b = store.board(h.b);
    const it = store.item(h.b, h.i);
    const s = store.sub(h.b, h.i, h.s);
    if (!b || !it || !s) return null;
    return { title: s.title, path: `${b.title}  /  ${it.title}`, color: cvar(b.color), start: s.start, end: s.end };
  }

  function refreshHover() {
    const p = hovered && previewOf(hovered);
    if (p) calendar.show(p); else { hovered = null; calendar.hide(); }
  }

  function setHover(el) {
    const row = el && el.closest ? el.closest('.sub') : null;
    const next = row ? { b: row.dataset.b, i: row.dataset.i, s: row.dataset.s } : null;
    if ((next && hovered && next.s === hovered.s) || (!next && !hovered)) return;
    hovered = next;
    refreshHover();
  }

  boardsEl.addEventListener('mouseover', (e) => setHover(e.target));
  boardsEl.addEventListener('mouseleave', () => setHover(null));
  boardsEl.addEventListener('focusin', (e) => setHover(e.target));
  boardsEl.addEventListener('focusout', (e) => { if (!boardsEl.contains(e.relatedTarget)) setHover(null); });

  /* ---------- actions ---------- */

  boardsEl.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      const row = e.target.closest('.sub'); // touch devices have no hover: a tap previews instead
      if (row) setHover(row);
      return;
    }
    const act = el.dataset.act;
    const at = (sel, key) => { const n = el.closest(sel); return n ? n.dataset[key] : undefined; };
    const bid = at('[data-b]', 'b');
    const iid = at('[data-i]', 'i');
    const sid = at('[data-s]', 's');

    // Accordion rows animate by flipping a class in place; everything else re-renders.
    if (act === 'toggle-board') {
      openBoards.has(bid) ? openBoards.delete(bid) : openBoards.add(bid);
      el.closest('.board').classList.toggle('open', openBoards.has(bid));
    } else if (act === 'toggle-item') {
      openItems.has(iid) ? openItems.delete(iid) : openItems.add(iid);
      el.closest('.item').classList.toggle('open', openItems.has(iid));
    } else if (act === 'toggle-done') {
      e.stopPropagation();
      const it = store.item(bid, iid);
      it.done = !it.done;
      if (it.done) it.subtasks.forEach((s) => { s.done = true; }); // finishing an item finishes its subtasks
      store.save(); render();
    } else if (act === 'toggle-sub') {
      const it = store.item(bid, iid);
      const s = store.sub(bid, iid, sid);
      s.done = !s.done;
      it.done = it.subtasks.every((x) => x.done);
      store.save(); render();
    } else if (act === 'del-sub') {
      const it = store.item(bid, iid);
      it.subtasks = it.subtasks.filter((x) => x.id !== sid);
      hovered = null;
      store.save(); render();
    } else if (act === 'edit-sub') {
      const s = store.sub(bid, iid, sid);
      modals.sub(s, (v) => { Object.assign(s, v); store.save(); render(); }, () => {
        const it = store.item(bid, iid);
        it.subtasks = it.subtasks.filter((x) => x.id !== sid);
        hovered = null; store.save(); render(); return true;
      });
    } else if (act === 'del-item') {
      e.stopPropagation();
      const b = store.board(bid);
      const it = store.item(bid, iid);
      if (confirm(`删除事项「${it.title}」及其子任务？`)) {
        b.items = b.items.filter((x) => x.id !== iid);
        hovered = null; store.save(); render();
      }
    } else if (act === 'edit-item') {
      e.stopPropagation();
      const it = store.item(bid, iid);
      modals.item(it, (v) => { Object.assign(it, v); store.save(); render(); }, () => {
        if (!confirm(`删除事项「${it.title}」及其子任务？`)) return false;
        const b = store.board(bid);
        b.items = b.items.filter((x) => x.id !== iid);
        hovered = null; store.save(); render(); return true;
      });
    } else if (act === 'add-item') {
      modals.item(null, (v) => {
        const it = { id: uid(), note: '', subtasks: [], done: false, ...v };
        store.board(bid).items.push(it);
        openBoards.add(bid); openItems.add(it.id);
        store.save(); render();
      });
    } else if (act === 'edit-board') {
      e.stopPropagation();
      openBoardModal(store.board(bid));
    } else if (act === 'add-board') {
      openBoardModal(null);
    }
  });

  function openBoardModal(board) {
    modals.board(board, (v) => {
      if (board) Object.assign(board, v);
      else {
        const nb = { id: uid(), items: [], ...v };
        store.data.boards.push(nb);
        openBoards.add(nb.id);
      }
      store.save(); render();
    }, () => {
      if (!confirm(`删除板块「${board.title}」及其全部事项？`)) return false;
      store.data.boards = store.data.boards.filter((x) => x.id !== board.id);
      hovered = null; store.save(); render();
      return true;
    });
  }

  boardsEl.addEventListener('submit', (e) => {
    const f = e.target.closest('form.add-sub');
    if (!f) return;
    e.preventDefault();
    const title = f.elements.title.value.trim();
    if (!title) { f.elements.title.focus(); return; }
    const item = f.closest('.item');
    const bid = item.dataset.b;
    const iid = item.dataset.i;
    store.item(bid, iid).subtasks.push(modals.newSub({ title, start: f.elements.start.value, end: f.elements.end.value }));
    store.item(bid, iid).done = false;
    f.reset(); // clear the draft so render() doesn't restore it
    store.save(); render(iid);
  });

  document.getElementById('addBoardBtn').addEventListener('click', () => openBoardModal(null));

  /* ---------- top bar ---------- */

  document.getElementById('addBoardBtn').innerHTML = `${icon('plus', 14)} 新建板块`;
  document.getElementById('exportBtn').innerHTML = icon('download');
  document.getElementById('importBtn').innerHTML = icon('upload');
  const themeBtn = document.getElementById('themeBtn');
  const syncIcon = () => { themeBtn.innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'); };
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('planner-theme', next); } catch (_) {}
    syncIcon();
  });
  syncIcon();

  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `planner-${App.today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  const importFile = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files[0];
    importFile.value = '';
    if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); } catch (_) { return toast('导入失败：不是有效的 JSON'); }
    if (!confirm('导入会覆盖当前全部数据，继续？')) return;
    if (!store.replace(data)) return toast('导入失败：数据结构不符合预期');
    hovered = null; render(); toast('已导入');
  });

  /* ---------- boot ---------- */

  const now = new Date();
  document.getElementById('eyebrow').textContent = App.eyebrow(now);
  document.getElementById('greeting').textContent = App.greeting(now);
  calendar.mount(document.getElementById('cal'));

  store.load().then(() => {
    const server = store.mode === 'server';
    document.getElementById('sync').classList.toggle('on', server);
    document.getElementById('syncText').textContent = server ? '已同步到服务器' : '仅本机浏览器';
    if (store.data.boards[0]) openBoards.add(store.data.boards[0].id);
    const first = store.data.boards[0] && store.data.boards[0].items[0];
    if (first) openItems.add(first.id);
    render();
    setTimeout(() => boardsEl.classList.remove('boot'), 900);
  });
})();
