(function () {
  const App = (window.App = window.App || {});
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = 86400000;

  App.WEEK = '日一二三四五六';
  App.ymd = (d) => `${String(d.getFullYear()).padStart(4, '0')}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  App.calendarDate = (y, m, day) => {
    const date = new Date(2000, 0, 1);
    date.setFullYear(y, m, day);
    return date;
  };
  App.parse = (s) => {
    const [y, m, day] = s.split('-').map(Number);
    return App.calendarDate(y, m - 1, day);
  };
  App.dateValue = (s) => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s) || s.startsWith('0000')) return '';
    return App.ymd(App.parse(s)) === s ? s : '';
  };
  App.today = () => App.ymd(new Date());
  App.addDays = (s, n) => { const d = App.parse(s); d.setDate(d.getDate() + n); return App.ymd(d); };
  App.diffDays = (a, b) => Math.round((App.parse(b) - App.parse(a)) / DAY);

  // Dates arrive as 'YYYY-MM-DD' or ''. Fill a missing end/start from the other, swap if reversed.
  App.normRange = (start, end) => {
    if (!start && !end) return ['', ''];
    start = start || end;
    end = end || start;
    return start <= end ? [start, end] : [end, start];
  };

  App.fmtMD = (s) => { const [, m, d] = s.split('-'); return `${m}.${d}`; };
  App.fmtCN = (s) => { const d = App.parse(s); return `${d.getMonth() + 1}月${d.getDate()}日`; };
  App.rangeLabel = (a, b) => (a === b ? App.fmtMD(a) : `${App.fmtMD(a)} → ${App.fmtMD(b)}`);

  App.dueInfo = (s, done) => {
    if (!s) return null;
    const n = App.diffDays(App.today(), s);
    let label = App.fmtMD(s);
    let tone = '';
    if (n === 0) { label = '今天'; tone = 'hot'; }
    else if (n === 1) label = '明天';
    else if (n < 0) { label = `逾期 ${-n} 天`; tone = 'hot'; }
    else if (n < 7) label = `周${App.WEEK[App.parse(s).getDay()]}`;
    return { label, tone: done ? '' : tone, n };
  };

  App.eyebrow = (d) => {
    const wk = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
    return `${wk} · ${pad(d.getMonth() + 1)}.${pad(d.getDate())} · ${d.getFullYear()}`;
  };
  App.greeting = (d) => {
    const h = d.getHours();
    if (h < 5) return '夜深了';
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  };

  // 6 rows x 7 cols, weeks start on Monday. col is 0 (Mon) .. 6 (Sun).
  App.monthCells = (y, m) => {
    const first = App.calendarDate(y, m, 1);
    const lead = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = App.calendarDate(y, m, 1 - lead + i);
      cells.push({ ymd: App.ymd(d), day: d.getDate(), col: i % 7, inMonth: d.getMonth() === m });
    }
    return cells;
  };
})();
