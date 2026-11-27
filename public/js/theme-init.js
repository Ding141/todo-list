// Runs before first paint so the saved (or system) theme doesn't flash.
(function () {
  var t = null;
  try { t = localStorage.getItem('planner-theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = t;
})();
