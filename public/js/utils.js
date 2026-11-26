(function () {
  const App = (window.App = window.App || {});

  App.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  App.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    flame: '<path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 3 3-1.5-3-1-6 0-8.5z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  };
  App.icon = (name, size = 18) =>
    `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  App.PALETTE = [
    { id: 'indigo', hex: '#6366f1' },
    { id: 'violet', hex: '#8b5cf6' },
    { id: 'rose', hex: '#f43f5e' },
    { id: 'coral', hex: '#f97316' },
    { id: 'amber', hex: '#eab308' },
    { id: 'emerald', hex: '#10b981' },
    { id: 'teal', hex: '#14b8a6' },
    { id: 'sky', hex: '#0ea5e9' },
    { id: 'slate', hex: '#64748b' },
  ];
  App.hex = (id) => (App.PALETTE.find((p) => p.id === id) || App.PALETTE[0]).hex;

  App.EMOJIS = ['📚', '🔬', '🌿', '💼', '🎯', '🏃', '🎨', '💡', '🧠', '✈️', '🏠', '💰', '🎵', '🍳', '📝', '⭐'];
  App.PRIO = { high: '高', mid: '中', low: '低' };

  const pad = (n) => String(n).padStart(2, '0');
  App.WEEK = '日一二三四五六';
  App.ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  App.offsetDate = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return App.ymd(d);
  };
  App.parseYmd = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  App.daysFromToday = (s) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Math.round((App.parseYmd(s) - t) / 86400000);
  };
  App.dueInfo = (s, done) => {
    if (!s) return null;
    const n = App.daysFromToday(s);
    const d = App.parseYmd(s);
    let label;
    let tone = 'normal';
    if (n === 0) { label = '今天'; tone = 'today'; }
    else if (n === 1) { label = '明天'; tone = 'soon'; }
    else if (n === -1) { label = '昨天'; tone = 'overdue'; }
    else if (n < 0) { label = `逾期 ${-n} 天`; tone = 'overdue'; }
    else if (n < 7) { label = `周${App.WEEK[d.getDay()]}`; tone = 'soon'; }
    else label = `${d.getMonth() + 1}月${d.getDate()}日`;
    if (done) tone = 'done';
    return { label, tone, n };
  };
  App.longDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日 · 星期${App.WEEK[d.getDay()]}`;
  App.greeting = (d) => {
    const h = d.getHours();
    if (h < 6) return '夜深了';
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  };

  let toastTimer;
  App.toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  };
})();
