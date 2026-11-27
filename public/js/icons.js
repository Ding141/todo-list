(function () {
  const App = (window.App = window.App || {});

  App.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  App.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
    chevron: '<path d="m6 9.5 6 6 6-6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    moon: '<path d="M20 14.2A8 8 0 1 1 9.8 4 6.4 6.4 0 0 0 20 14.2Z"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14"/>',
    left: '<path d="m14.5 6-6 6 6 6"/>',
    right: '<path d="m9.5 6 6 6-6 6"/>',
  };
  App.icon = (name, size = 16) =>
    `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // Colour ids map to --c-<id> tokens in base.css, which change with the theme.
  App.PALETTE = ['indigo', 'violet', 'rose', 'coral', 'amber', 'emerald', 'teal', 'sky', 'slate'];
  App.cvar = (id) => `var(--c-${App.PALETTE.includes(id) ? id : 'indigo'})`;
  App.PRIO = { high: '高', mid: '中', low: '低' };

  let toastTimer;
  App.toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  };
})();
