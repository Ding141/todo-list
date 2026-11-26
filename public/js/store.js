(function () {
  const App = (window.App = window.App || {});
  const LS_KEY = 'planner-data-v1';
  const API = 'api/data';

  let mode = 'local'; // 'server' when the backend answers
  let saveTimer = null;

  function sampleData() {
    const u = App.uid;
    return {
      version: 1,
      boards: [
        {
          id: u(), title: '课程', emoji: '📚', color: 'indigo', desc: '本学期课程与作业',
          items: [
            { id: u(), title: '自动控制原理 · 第三次作业', note: '第 4 章习题 4.2 – 4.9', due: App.offsetDate(2), prio: 'high', done: false,
              subtasks: [
                { id: u(), title: '复习根轨迹绘制规则', done: true },
                { id: u(), title: '完成 4.2 – 4.5', done: false },
                { id: u(), title: '完成 4.6 – 4.9 并检查', done: false },
              ] },
            { id: u(), title: '英语 Presentation', note: '', due: App.offsetDate(6), prio: 'mid', done: false,
              subtasks: [
                { id: u(), title: '选题', done: true },
                { id: u(), title: '做 PPT', done: false },
              ] },
          ],
        },
        {
          id: u(), title: '科研', emoji: '🔬', color: 'teal', desc: '课题、论文与实验',
          items: [
            { id: u(), title: '文献调研', note: '整理近三年相关工作', due: App.offsetDate(9), prio: 'mid', done: false,
              subtasks: [
                { id: u(), title: '检索关键词并下载', done: true },
                { id: u(), title: '精读 5 篇并做笔记', done: false },
              ] },
            { id: u(), title: '周组会汇报', note: '', due: App.offsetDate(0), prio: 'high', done: false, subtasks: [] },
          ],
        },
        {
          id: u(), title: '生活', emoji: '🌿', color: 'coral', desc: '运动、杂事与娱乐',
          items: [
            { id: u(), title: '每周跑步 3 次', note: '', due: '', prio: 'low', done: false,
              subtasks: [
                { id: u(), title: '周一', done: true },
                { id: u(), title: '周三', done: false },
                { id: u(), title: '周六', done: false },
              ] },
          ],
        },
      ],
    };
  }

  function normalize(d) {
    if (!d || !Array.isArray(d.boards)) return null;
    d.version = 1;
    d.boards.forEach((b) => {
      b.items = Array.isArray(b.items) ? b.items : [];
      b.items.forEach((it) => {
        it.subtasks = Array.isArray(it.subtasks) ? it.subtasks : [];
      });
    });
    return d;
  }

  App.store = {
    data: null,
    get mode() { return mode; },

    async load() {
      try {
        const r = await fetch(API, { cache: 'no-store' });
        if (!r.ok) throw new Error(r.status);
        mode = 'server';
        const body = await r.json();
        this.data = normalize(body) || sampleData();
        if (!body || !body.boards) this.saveNow();
      } catch (e) {
        mode = 'local';
        let local = null;
        try { local = JSON.parse(localStorage.getItem(LS_KEY)); } catch (_) {}
        this.data = normalize(local) || sampleData();
      }
      return this.data;
    },

    save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveNow(), 400);
    },

    async saveNow() {
      const json = JSON.stringify(this.data);
      try { localStorage.setItem(LS_KEY, json); } catch (_) {}
      if (mode !== 'server') return;
      try {
        const r = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json });
        if (!r.ok) throw new Error(r.status);
      } catch (e) {
        App.toast('同步到服务器失败，已保存在本机浏览器');
      }
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
  };
})();
