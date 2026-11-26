(function () {
  const { store, esc, icon, PALETTE, EMOJIS, hex, dueInfo, longDate, greeting, toast, uid, PRIO } = App;

  const grid = document.getElementById('boardGrid');
  const openBoards = new Set();
  const openItems = new Set();

  /* ---------------- rendering ---------------- */

  function progressOf(board) {
    const subs = board.items.flatMap((i) => i.subtasks);
    const total = board.items.length + subs.length;
    const done = board.items.filter((i) => i.done).length + subs.filter((s) => s.done).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function renderStats() {
    const items = store.data.boards.flatMap((b) => b.items);
    const open = items.filter((i) => !i.done);
    const overdue = open.filter((i) => i.due && dueInfo(i.due).tone === 'overdue').length;
    const today = open.filter((i) => i.due && dueInfo(i.due).n === 0).length;
    document.getElementById('stats').innerHTML = [
      ['板块', store.data.boards.length, ''],
      ['进行中', open.length, ''],
      ['今天', today, today ? 'ok' : ''],
      ['逾期', overdue, overdue ? 'bad' : ''],
    ].map(([k, v, cls]) => `<div class="stat ${cls}"><b>${v}</b><span>${k}</span></div>`).join('');
  }

  function chipHTML(item) {
    const chips = [];
    if (item.due) {
      const d = dueInfo(item.due, item.done);
      chips.push(`<span class="chip due-${d.tone}">${icon('calendar', 13)} ${esc(d.label)}</span>`);
    }
    if (item.prio && item.prio !== 'low') {
      chips.push(`<span class="chip prio-${item.prio}">${esc(PRIO[item.prio])}</span>`);
    }
    const n = item.subtasks.length;
    if (n) {
      const dn = item.subtasks.filter((s) => s.done).length;
      chips.push(`<span class="chip">${dn}/${n}</span>`);
    }
    return chips.join('');
  }

  function subHTML(b, it, s) {
    return `<div class="sub ${s.done ? 'done' : ''}">
      <button class="check sm ${s.done ? 'on' : ''}" data-act="toggle-sub" data-b="${b.id}" data-i="${it.id}" data-s="${s.id}">${icon('check', 12)}</button>
      <span class="sub-title">${esc(s.title)}</span>
      <button class="icon-btn" data-act="del-sub" data-b="${b.id}" data-i="${it.id}" data-s="${s.id}" title="删除">${icon('x', 14)}</button>
    </div>`;
  }

  function itemHTML(b, it) {
    const open = openItems.has(it.id);
    return `<article class="item ${it.done ? 'done' : ''} ${open ? 'open' : ''}" style="--mark:${hex(b.color)}">
      <div class="item-head" data-act="toggle-item" data-b="${b.id}" data-i="${it.id}">
        <button class="check ${it.done ? 'on' : ''}" data-act="toggle-done" data-b="${b.id}" data-i="${it.id}">${icon('check', 14)}</button>
        <div class="item-text">
          <div class="item-title">${esc(it.title)}</div>
          ${it.note ? `<div class="item-note">${esc(it.note)}</div>` : ''}
        </div>
        <div class="chips">${chipHTML(it)}</div>
        <div class="item-tools">
          <button class="icon-btn" data-act="edit-item" data-b="${b.id}" data-i="${it.id}" title="编辑">${icon('edit', 15)}</button>
          <button class="icon-btn" data-act="del-item" data-b="${b.id}" data-i="${it.id}" title="删除">${icon('trash', 15)}</button>
          <span class="chev">${icon('chevron', 16)}</span>
        </div>
      </div>
      <div class="item-body"><div class="item-body-inner"><div class="sub-list">
        ${it.subtasks.map((s) => subHTML(b, it, s)).join('') || '<div class="empty-hint">还没有子任务</div>'}
        <form class="add-row" data-act="add-sub" data-b="${b.id}" data-i="${it.id}">
          <input name="title" placeholder="添加子任务，回车确认" maxlength="120" />
        </form>
      </div></div></div>
    </article>`;
  }

  function boardHTML(b) {
    const open = openBoards.has(b.id);
    const p = progressOf(b);
    return `<section class="board ${open ? 'open' : ''}" style="--mark:${hex(b.color)}">
      <div class="board-head" data-act="toggle-board" data-b="${b.id}">
        <div class="board-mark">${esc(b.emoji || '📌')}</div>
        <div class="board-text">
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.desc || (b.items.length ? b.items.length + ' 个事项' : '还没有事项'))}</p>
        </div>
        <div class="board-meta">
          <div class="progress">
            <div class="progress-bar"><i style="width:${p.pct}%"></i></div>
            <div class="progress-label">${p.done}/${p.total} · ${p.pct}%</div>
          </div>
          <button class="icon-btn" data-act="edit-board" data-b="${b.id}" title="编辑板块">${icon('edit', 15)}</button>
          <span class="chev">${icon('chevron', 18)}</span>
        </div>
      </div>
      <div class="board-body"><div class="board-body-inner"><div class="board-body-pad">
        ${b.items.map((it) => itemHTML(b, it)).join('') || '<div class="empty-hint">这个板块还是空的，添加第一个事项吧。</div>'}
        <div><button class="btn btn-sm" data-act="add-item" data-b="${b.id}">${icon('plus', 14)} 添加事项</button></div>
      </div></div></div>
    </section>`;
  }

  function render() {
    const focus = document.activeElement;
    const keep = focus && focus.closest('.add-row') ? {
      b: focus.closest('[data-b]').dataset.b,
      i: focus.closest('[data-i]').dataset.i,
      val: focus.value,
    } : null;

    grid.innerHTML = store.data.boards.map(boardHTML).join('') +
      `<button class="btn btn-ghost" data-act="add-board" style="align-self:flex-start">${icon('plus', 15)} 新建板块</button>`;
    renderStats();

    if (keep) {
      const f = grid.querySelector(`form[data-i="${keep.i}"] input`);
      if (f) { f.value = keep.val; f.focus(); f.setSelectionRange(keep.val.length, keep.val.length); }
    }
  }

  /* ---------------- actions ---------------- */

  grid.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const { act, b, i, s } = el.dataset;

    // Toggle the class in place (no re-render) so the expand animation plays.
    if (act === 'toggle-board') {
      openBoards.has(b) ? openBoards.delete(b) : openBoards.add(b);
      el.closest('.board').classList.toggle('open', openBoards.has(b));
    } else if (act === 'toggle-item') {
      openItems.has(i) ? openItems.delete(i) : openItems.add(i);
      el.closest('.item').classList.toggle('open', openItems.has(i));
    }
    else if (act === 'toggle-done') {
      e.stopPropagation();
      const it = store.item(b, i); it.done = !it.done; store.save(); render();
    } else if (act === 'toggle-sub') {
      const it = store.item(b, i);
      const sub = it.subtasks.find((x) => x.id === s);
      sub.done = !sub.done;
      if (it.subtasks.length && it.subtasks.every((x) => x.done)) it.done = true;
      store.save(); render();
    } else if (act === 'del-sub') {
      const it = store.item(b, i);
      it.subtasks = it.subtasks.filter((x) => x.id !== s);
      store.save(); render();
    } else if (act === 'del-item') {
      e.stopPropagation();
      const board = store.board(b);
      const it = store.item(b, i);
      if (confirm(`删除事项「${it.title}」？`)) {
        board.items = board.items.filter((x) => x.id !== i);
        store.save(); render();
      }
    } else if (act === 'edit-board') { e.stopPropagation(); openBoardModal(store.board(b)); }
    else if (act === 'edit-item') { e.stopPropagation(); openItemModal(b, store.item(b, i)); }
    else if (act === 'add-item') { openItemModal(b, null); }
    else if (act === 'add-board') { openBoardModal(null); }
  });

  grid.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-act="add-sub"]');
    if (!form) return;
    e.preventDefault();
    const input = form.elements.title;
    const title = input.value.trim();
    if (!title) return;
    store.item(form.dataset.b, form.dataset.i).subtasks.push({ id: uid(), title, done: false });
    input.value = '';
    store.save(); render();
  });

  document.getElementById('addBoardBtn').addEventListener('click', () => openBoardModal(null));

  /* ---------------- modal ---------------- */

  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');

  function swatchHTML(selected) {
    return `<div class="swatches">${PALETTE.map((p) =>
      `<button type="button" class="swatch ${p.id === selected ? 'on' : ''}" style="--c:${p.hex}" data-val="${p.id}"></button>`).join('')}</div>`;
  }
  function emojiHTML(selected) {
    return `<div class="emojis">${EMOJIS.map((e) =>
      `<button type="button" class="emoji-opt ${e === selected ? 'on' : ''}" data-val="${e}">${e}</button>`).join('')}</div>`;
  }

  function openBoardModal(board) {
    const creating = !board;
    form.innerHTML = `
      <h3>${creating ? '新建板块' : '编辑板块'}</h3>
      <div class="field"><label>名称</label><input name="title" maxlength="40" required value="${esc(board ? board.title : '')}" placeholder="例如：课程" /></div>
      <div class="field"><label>一句话描述</label><input name="desc" maxlength="80" value="${esc(board ? board.desc : '')}" placeholder="可选" /></div>
      <div class="field"><label>图标</label>${emojiHTML(board ? board.emoji : '📚')}</div>
      <div class="field"><label>颜色</label>${swatchHTML(board ? board.color : 'indigo')}</div>
      <input type="hidden" name="emoji" value="${board ? board.emoji : '📚'}" />
      <input type="hidden" name="color" value="${board ? board.color : 'indigo'}" />
      <div class="modal-actions">
        ${creating ? '<span></span>' : `<button type="button" class="btn btn-ghost btn-danger" data-del>删除板块</button>`}
        <div class="right"><button type="button" class="btn" data-close>取消</button><button class="btn btn-primary">${creating ? '创建' : '保存'}</button></div>
      </div>`;
    form.onsubmit = (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form));
      if (!v.title.trim()) return;
      if (creating) {
        const nb = { id: uid(), title: v.title.trim(), desc: v.desc.trim(), emoji: v.emoji, color: v.color, items: [] };
        store.data.boards.push(nb);
        openBoards.add(nb.id);
      } else {
        Object.assign(board, { title: v.title.trim(), desc: v.desc.trim(), emoji: v.emoji, color: v.color });
      }
      store.save(); closeModal(); render();
    };
    const del = form.querySelector('[data-del]');
    if (del) del.onclick = () => {
      if (confirm(`删除板块「${board.title}」及其全部事项？`)) {
        store.data.boards = store.data.boards.filter((x) => x.id !== board.id);
        store.save(); closeModal(); render();
      }
    };
    showModal();
  }

  function openItemModal(bid, item) {
    const creating = !item;
    const today = App.ymd(new Date());
    form.innerHTML = `
      <h3>${creating ? '新建事项' : '编辑事项'}</h3>
      <div class="field"><label>事项</label><input name="title" maxlength="120" required value="${esc(item ? item.title : '')}" placeholder="要做的事" /></div>
      <div class="field"><label>备注</label><textarea name="note" maxlength="500" placeholder="可选">${esc(item ? item.note : '')}</textarea></div>
      <div class="row2">
        <div class="field"><label>截止日期</label><input type="date" name="due" value="${item && item.due ? item.due : ''}" /></div>
        <div class="field"><label>优先级</label>
          <select name="prio">
            ${['low', 'mid', 'high'].map((p) => `<option value="${p}" ${item && item.prio === p ? 'selected' : ''}>${PRIO[p]}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <span></span>
        <div class="right"><button type="button" class="btn" data-close>取消</button><button class="btn btn-primary">${creating ? '添加' : '保存'}</button></div>
      </div>`;
    form.onsubmit = (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form));
      if (!v.title.trim()) return;
      if (creating) {
        store.board(bid).items.push({ id: uid(), title: v.title.trim(), note: v.note.trim(), due: v.due, prio: v.prio, done: false, subtasks: [] });
        openBoards.add(bid);
      } else {
        Object.assign(item, { title: v.title.trim(), note: v.note.trim(), due: v.due, prio: v.prio });
      }
      store.save(); closeModal(); render();
    };
    showModal();
  }

  function showModal() {
    modal.hidden = false;
    form.querySelector('input,textarea')?.focus();
  }
  function closeModal() { modal.hidden = true; form.innerHTML = ''; }
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
  form.addEventListener('click', (e) => {
    const sw = e.target.closest('.swatch, .emoji-opt');
    if (!sw) return;
    sw.parentElement.querySelectorAll('.on').forEach((x) => x.classList.remove('on'));
    sw.classList.add('on');
    form.elements[sw.classList.contains('swatch') ? 'color' : 'emoji'].value = sw.dataset.val;
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------------- top bar ---------------- */

  const now = new Date();
  document.getElementById('heroDate').textContent = longDate(now);
  document.getElementById('heroTitle').textContent = greeting(now);

  document.getElementById('addBoardBtn').innerHTML = `${icon('plus', 15)} 新建板块`;
  document.getElementById('exportBtn').innerHTML = icon('download', 16);
  document.getElementById('importBtn').innerHTML = icon('upload', 16);
  const themeBtn = document.getElementById('themeBtn');

  function syncThemeIcon() {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeBtn.innerHTML = icon(dark ? 'sun' : 'moon', 16);
  }
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('planner-theme', next); } catch (e) {}
    syncThemeIcon();
  });
  syncThemeIcon();

  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `planner-${App.ymd(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const importFile = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files[0];
    importFile.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm('导入会覆盖当前全部数据，继续？')) return;
      if (!store.replace(data)) throw new Error('格式不对');
      toast('已导入');
      render();
    } catch (e) { toast('导入失败：文件不是有效的规划数据'); }
  });

  /* ---------------- boot ---------------- */

  store.load().then(() => {
    document.getElementById('syncBadge').textContent = store.mode === 'server' ? '已连接服务器' : '仅本机浏览器';
    if (store.data.boards[0]) openBoards.add(store.data.boards[0].id);
    render();
  });
})();
