(function () {
  const App = (window.App = window.App || {});
  const LS_KEY = 'planner-data-v1';
  const API = 'api/data';
  const VERSION = 2;

  let mode = 'local'; // becomes 'server' once the backend answers
  let saveTimer = null;
  let pendingSync = Promise.resolve();

  function sampleData() {
    const u = App.uid;
    const t = (n) => App.addDays(App.today(), n);
    const sub = (title, a, b, done = false) => ({ id: u(), title, done, start: a == null ? '' : t(a), end: b == null ? '' : t(b) });
    return {
      version: VERSION,
      boards: [
        {
          id: u(), title: '课程', color: 'indigo', desc: '本学期课程与作业',
          items: [
            { id: u(), title: '自动控制原理 · 第三次作业', note: '第 4 章习题 4.2 – 4.9', due: t(6), prio: 'high', done: false,
              subtasks: [
                sub('复习根轨迹绘制规则', -3, -1, true),
                sub('完成 4.2 – 4.5', 0, 2),
                sub('完成 4.6 – 4.9 并检查', 3, 6),
              ] },
            { id: u(), title: '英语 Presentation', note: '', due: t(12), prio: 'mid', done: false,
              subtasks: [sub('选题', -4, -2, true), sub('做 PPT', 1, 9), sub('排练两遍', 10, 11)] },
          ],
        },
        {
          id: u(), title: '科研', color: 'teal', desc: '课题、论文与实验',
          items: [
            { id: u(), title: '文献调研', note: '整理近三年相关工作', due: t(14), prio: 'mid', done: false,
              subtasks: [sub('检索关键词并下载', -5, -2, true), sub('精读 5 篇并做笔记', 0, 11)] },
            { id: u(), title: '周组会汇报', note: '', due: t(0), prio: 'high', done: false,
              subtasks: [sub('准备汇报材料', -1, 0)] },
          ],
        },
        {
          id: u(), title: '生活', color: 'coral', desc: '运动、杂事与放松',
          items: [
            { id: u(), title: '每周跑步 3 次', note: '', due: '', prio: 'low', done: false,
              subtasks: [sub('周一', -2, -2, true), sub('周三', 1, 1), sub('周六', 4, 4)] },
          ],
        },
      ],
    };
  }

  // Accepts v1 data (no subtask dates, emoji field) and returns v2. Unknown fields are kept.
  function normalize(d) {
    if (!d || !Array.isArray(d.boards)) return null;
    const isEntry = (entry) => entry && typeof entry.id === 'string' && entry.id && typeof entry.title === 'string';
    for (const b of d.boards) {
      if (!isEntry(b)) return null;
      b.items = Array.isArray(b.items) ? b.items : [];
      if (typeof b.desc !== 'string') b.desc = '';
      if (!App.PALETTE.includes(b.color)) b.color = App.PALETTE[0];
      for (const it of b.items) {
        if (!isEntry(it)) return null;
        it.subtasks = Array.isArray(it.subtasks) ? it.subtasks : [];
        if (typeof it.note !== 'string') it.note = '';
        it.due = App.dateValue(it.due);
        if (typeof it.prio !== 'string' || !Object.hasOwn(App.PRIO, it.prio)) it.prio = 'low';
        for (const s of it.subtasks) {
          if (!isEntry(s)) return null;
          const [a, z] = App.normRange(App.dateValue(s.start), App.dateValue(s.end));
          s.start = a;
          s.end = z;
        }
      }
    }
    d.version = VERSION;
    return d;
  }

  function readLocal() {
    try { return normalize(JSON.parse(localStorage.getItem(LS_KEY))); } catch (_) { return null; }
  }

  function writeLocal(data) {
    const json = JSON.stringify(data);
    try { localStorage.setItem(LS_KEY, json); } catch (_) {}
    return json;
  }

  function sync(json) {
    if (mode !== 'server') return;
    pendingSync = pendingSync.then(async () => {
      try {
        const r = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json });
        if (!r.ok) throw new Error(r.status);
      } catch (_) {
        App.toast('同步到服务器失败，改动先保存在本机浏览器');
      }
    });
    return pendingSync;
  }

  App.store = {
    data: null,
    get mode() { return mode; },

    async load() {
      let fromServer = null;
      try {
        const r = await fetch(API, { cache: 'no-store' });
        if (!r.ok) throw new Error(r.status);
        const body = await r.json();
        fromServer = normalize(body);
        if (body !== null && !fromServer) throw new Error('Invalid server data');
        mode = 'server';
      } catch (_) {
        mode = 'local';
      }
      // Server empty (first deploy) -> adopt whatever this browser already has, else the sample.
      this.data = fromServer || readLocal() || sampleData();
      if (mode === 'server' && !fromServer) this.saveNow();
      return this.data;
    },

    save() {
      clearTimeout(saveTimer);
      const json = writeLocal(this.data);
      saveTimer = setTimeout(() => sync(json), 350);
    },

    saveNow() {
      clearTimeout(saveTimer);
      return sync(writeLocal(this.data));
    },

    replace(d) {
      const n = normalize(d);
      if (!n) return false;
      this.data = n;
      this.saveNow();
      return true;
    },

    board(id) { return this.data.boards.find((b) => b.id === id); },
    item(bid, iid) { const b = this.board(bid); return b && b.items.find((i) => i.id === iid); },
    sub(bid, iid, sid) { const i = this.item(bid, iid); return i && i.subtasks.find((s) => s.id === sid); },
  };
})();
