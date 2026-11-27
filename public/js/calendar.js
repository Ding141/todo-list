(function () {
  const { esc, icon, ymd, parse, today, diffDays, calendarDate } = App;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const now = new Date();
  let viewY = now.getFullYear();
  let viewM = now.getMonth();
  let cells = [];        // [{el, ymd, col}]
  let preview = null;    // {title, path, color, start, end} | null
  let deadlines = new Set();
  let root, gridEl, titleEl, footEl;

  function shell() {
    root.innerHTML = `
      <div class="cal-head">
        <div class="cal-title"><span class="cal-month" data-m></span><span class="cal-year" data-y></span></div>
        <div class="cal-nav">
          <button class="icon-btn boxed sm" data-nav="-1" title="上个月" aria-label="上个月">${icon('left', 15)}</button>
          <button class="btn btn-quiet cal-today" data-nav="0">今天</button>
          <button class="icon-btn boxed sm" data-nav="1" title="下个月" aria-label="下个月">${icon('right', 15)}</button>
        </div>
      </div>
      <div class="cal-week">${['一', '二', '三', '四', '五', '六', '日'].map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="cal-grid" data-grid></div>
      <div class="cal-foot" data-foot></div>`;
    gridEl = root.querySelector('[data-grid]');
    titleEl = { m: root.querySelector('[data-m]'), y: root.querySelector('[data-y]') };
    footEl = root.querySelector('[data-foot]');
  }

  function buildGrid() {
    titleEl.m.textContent = MONTHS[viewM];
    titleEl.y.textContent = viewY;
    const t = today();
    cells = App.monthCells(viewY, viewM).map((c) => {
      const el = document.createElement('div');
      el.className = 'cell' + (c.inMonth ? '' : ' out') + (c.ymd === t ? ' today' : '') + ` col${c.col}`;
      el.innerHTML = `<span class="num">${c.day}</span><i class="dot"></i>`;
      gridEl.appendChild(el);
      return { el, ymd: c.ymd };
    });
    gridEl.replaceChildren(...cells.map((c) => c.el));
    paint();
  }

  function paint() {
    const hasRange = preview && preview.start;
    root.style.setProperty('--pc', preview ? preview.color : 'var(--text)');
    cells.forEach(({ el, ymd: d }) => {
      const inR = hasRange && d >= preview.start && d <= preview.end;
      el.classList.toggle('in', !!inR);
      el.classList.toggle('rs', !!inR && d === preview.start);
      el.classList.toggle('re', !!inR && d === preview.end);
      el.classList.toggle('dl', deadlines.has(d));
    });
    paintFoot();
  }

  function paintFoot() {
    if (!preview) {
      footEl.innerHTML = '<p class="cal-hint">将鼠标移到任意子任务上，<br />这里会标出它的日程。</p>';
      return;
    }
    const p = preview;
    let when;
    if (!p.start) when = '<span class="muted">还没有安排日期</span>';
    else {
      const n = diffDays(p.start, p.end) + 1;
      when = `<span class="mono">${App.fmtMD(p.start)}${p.start === p.end ? '' : ` → ${App.fmtMD(p.end)}`}</span><span class="muted"> · ${n} 天</span>`;
    }
    footEl.innerHTML = `
      <div class="cal-card">
        <span class="swatch-dot" style="background:${p.color}"></span>
        <div>
          <div class="cal-card-title">${esc(p.title)}</div>
          <div class="cal-card-path">${esc(p.path)}</div>
          <div class="cal-card-when">${when}</div>
        </div>
      </div>`;
  }

  function collectDeadlines(data) {
    const s = new Set();
    data.boards.forEach((b) => b.items.forEach((it) => {
      if (!it.done && it.due) s.add(it.due);
      it.subtasks.forEach((x) => { if (!x.done && x.end) s.add(x.end); });
    }));
    return s;
  }

  const hit = (a, z) => {
    // does [a, z] touch the displayed month?
    const first = ymd(calendarDate(viewY, viewM, 1));
    const last = ymd(calendarDate(viewY, viewM + 1, 0));
    return a <= last && z >= first;
  };

  let restore = null; // month to return to after a preview jumped elsewhere

  App.calendar = {
    mount(el) { root = el; shell(); buildGrid(); },

    setData(data) { deadlines = collectDeadlines(data); paint(); },

    show(p) {
      preview = p;
      if (p && p.start && !hit(p.start, p.end)) {
        if (!restore) restore = [viewY, viewM];
        const d = parse(p.start);
        viewY = d.getFullYear(); viewM = d.getMonth();
        buildGrid();
        return;
      }
      paint();
    },

    hide() {
      preview = null;
      if (restore) { [viewY, viewM] = restore; restore = null; buildGrid(); return; }
      paint();
    },

    nav(dir) {
      restore = null;
      if (dir === 0) { viewY = now.getFullYear(); viewM = now.getMonth(); }
      else { const d = calendarDate(viewY, viewM + dir, 1); viewY = d.getFullYear(); viewM = d.getMonth(); }
      buildGrid();
    },
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nav]');
    if (b && root && root.contains(b)) App.calendar.nav(Number(b.dataset.nav));
  });
})();
