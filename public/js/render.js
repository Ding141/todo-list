(function () {
  const { esc, icon, cvar, PRIO, rangeLabel, dueInfo, today } = App;
  const R = (App.render = {});

  // A "leaf" is the smallest schedulable unit: a subtask, or an item that has no subtasks.
  R.leaves = (boards) => boards.flatMap((b) => b.items.flatMap((it) =>
    it.subtasks.length
      ? it.subtasks.map((s) => ({ start: s.start, end: s.end, done: s.done }))
      : [{ start: it.due, end: it.due, done: it.done }]));

  R.stats = (data) => {
    const t = today();
    const open = R.leaves(data.boards).filter((l) => !l.done);
    const items = data.boards.reduce((n, b) => n + b.items.filter((i) => !i.done).length, 0);
    const late = open.filter((l) => l.end && l.end < t).length;
    const now = open.filter((l) => l.start && l.start <= t && l.end >= t).length;
    return [['板块', data.boards.length, false], ['进行中', items, false], ['今日', now, false], ['逾期', late, late > 0]]
      .map(([k, v, hot]) => `<div class="stat${hot ? ' hot' : ''}"><b>${v}</b><span>${k}</span></div>`).join('');
  };

  function itemMeta(it) {
    const out = [];
    if (it.prio && it.prio !== 'low') out.push(`<span class="tag ${it.prio}">${PRIO[it.prio]}</span>`);
    const d = it.due && dueInfo(it.due, it.done);
    if (d) out.push(`<span class="${d.tone}">${esc(d.label)}</span>`);
    if (it.subtasks.length) out.push(`<span>${it.subtasks.filter((s) => s.done).length}/${it.subtasks.length}</span>`);
    return out.join('');
  }

  function sub(b, it, s) {
    let when = '未排期';
    let cls = ' none';
    if (s.start) {
      when = rangeLabel(s.start, s.end);
      cls = !s.done && s.end < today() ? ' hot' : '';
    }
    return `<div class="sub${s.done ? ' done' : ''}" data-b="${esc(b.id)}" data-i="${esc(it.id)}" data-s="${esc(s.id)}">
      <button class="check${s.done ? ' on' : ''}" data-act="toggle-sub" aria-label="完成">${icon('check')}</button>
      <span class="sub-title">${esc(s.title)}</span>
      <span class="sub-when${cls}">${when}</span>
      <span class="tools">
        <button class="icon-btn sm" data-act="edit-sub" title="编辑" aria-label="编辑">${icon('edit', 14)}</button>
        <button class="icon-btn sm" data-act="del-sub" title="删除" aria-label="删除">${icon('x', 14)}</button>
      </span>
    </div>`;
  }

  function item(b, it, openItems) {
    return `<article class="item${it.done ? ' done' : ''}${openItems.has(it.id) ? ' open' : ''}" data-b="${esc(b.id)}" data-i="${esc(it.id)}">
      <div class="item-head" data-act="toggle-item">
        <button class="check${it.done ? ' on' : ''}" data-act="toggle-done" aria-label="完成">${icon('check')}</button>
        <div>
          <div class="item-title">${esc(it.title)}</div>
          ${it.note ? `<div class="item-note">${esc(it.note)}</div>` : ''}
        </div>
        <div class="meta">${itemMeta(it)}</div>
        <div class="tools">
          <button class="icon-btn sm" data-act="edit-item" title="编辑" aria-label="编辑">${icon('edit', 14)}</button>
          <button class="icon-btn sm" data-act="del-item" title="删除" aria-label="删除">${icon('trash', 14)}</button>
          <span class="chev">${icon('chevron')}</span>
        </div>
      </div>
      <div class="fold"><div class="fold-in"><div class="subs">
        ${it.subtasks.map((s) => sub(b, it, s)).join('')}
        <form class="add-sub" data-act="add-sub">
          <input class="field" name="title" placeholder="添加子任务" maxlength="120" aria-label="子任务名称" />
          <input class="field dt" type="date" name="start" aria-label="开始日期" />
          <span class="arrow">→</span>
          <input class="field dt" type="date" name="end" aria-label="结束日期" />
          <button class="btn" aria-label="添加">${icon('plus', 14)}</button>
        </form>
      </div></div></div>
    </article>`;
  }

  R.board = (b, idx, openBoards, openItems) => {
    const leaves = R.leaves([b]);
    const done = leaves.filter((l) => l.done).length;
    const pct = leaves.length ? Math.round((done / leaves.length) * 100) : 0;
    return `<section class="board${openBoards.has(b.id) ? ' open' : ''}" style="--bc:${cvar(b.color)}" data-b="${esc(b.id)}">
      <div class="board-head" data-act="toggle-board">
        <span class="board-idx">${String(idx + 1).padStart(2, '0')}</span>
        <div><h3 class="board-title">${esc(b.title)}</h3>
          <p class="board-desc">${esc(b.desc || (b.items.length ? `${b.items.length} 个事项` : '还没有事项'))}</p></div>
        <div class="board-meta"><div class="prog"><div class="prog-bar"><i style="width:${pct}%"></i></div><span>${done}/${leaves.length}</span></div></div>
        <div class="tools">
          <button class="icon-btn sm" data-act="edit-board" title="编辑板块" aria-label="编辑板块">${icon('edit', 14)}</button>
          <span class="chev">${icon('chevron', 18)}</span>
        </div>
      </div>
      <div class="fold"><div class="fold-in"><div class="board-body">
        ${b.items.map((it) => item(b, it, openItems)).join('') || '<div class="empty">这个板块还是空的。</div>'}
        <button class="btn btn-quiet add-item" data-act="add-item">${icon('plus', 14)} 添加事项</button>
      </div></div></div>
    </section>`;
  };

  R.addBoard = () => `<button class="add-board" data-act="add-board">${icon('plus', 15)} 新建板块</button>`;
})();
