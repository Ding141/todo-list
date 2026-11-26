// Runs before first paint so a saved theme doesn't flash.
try {
  var t = localStorage.getItem('planner-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
