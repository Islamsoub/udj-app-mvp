/* Unipocket landing: offline-mode demo. States: on → off → back.
   It cycles every 3.5s while at least 40% visible, and stops for good once the visitor picks a state. */
(function () {
  var U = window.Unipocket; if (!U) return;
  var demo = document.getElementById('offDemo'); if (!demo) return;
  var order = ['on', 'off', 'back'], state = 'on', auto = !U.reduceMotion, timer = null;
  var banner = document.getElementById('offBanner'), send = document.getElementById('offSend');
  var tabs = demo.querySelectorAll('.seg [role="tab"]');
  function render() {
    demo.setAttribute('data-state', state);
    banner.textContent = U.t('off.banner.' + state);
    demo.querySelectorAll('[data-st]').forEach(function (s) { s.textContent = U.t(state === 'off' ? 'off.status.cached' : 'off.status.fresh'); });
    send.textContent = U.t({ on: 'off.status.sent', off: 'off.status.pending', back: 'off.status.auto' }[state]);
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-state') === state;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    });
    demo.querySelectorAll('.off-steps li').forEach(function (li) {
      var btn = li.querySelector('button');
      if (li.getAttribute('data-state') === state) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });
  }
  function set(s, user) {
    state = s; render();
    if (user) { auto = false; clearInterval(timer); }
  }
  demo.querySelectorAll('.off-steps button').forEach(function (b) {
    b.addEventListener('click', function () { set(b.closest('li').getAttribute('data-state'), true); });
  });
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { set(b.getAttribute('data-state'), true); });
    b.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length]; n.click(); n.focus();
    });
  });
  if (auto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      clearInterval(timer);
      if (es[0].isIntersecting && auto) timer = setInterval(function () { set(order[(order.indexOf(state) + 1) % 3], false); }, 3500);
    }, { threshold: 0.4 }).observe(demo);
  }
  U.onLang(render);
})();
