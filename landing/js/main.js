/* Unipocket landing: core (language switch, links, menu, sticky bar, reveal, toast).
   Loads after config/links.js and i18n/strings.js. Exposes window.Unipocket for the block scripts. */
(function () {
  var L = window.UNIPOCKET_LINKS || {};
  var S = window.UNIPOCKET_STRINGS || { fr: {}, ar: {} };
  var root = document.documentElement;
  var listeners = [];
  var lang = 'fr';
  var urlLang = (/[?&]lang=(fr|ar)\b/.exec(location.search) || [])[1] || null;

  function t(k) { return (S[lang] && S[lang][k] != null) ? S[lang][k] : (S.fr[k] != null ? S.fr[k] : k); }

  function setMeta(sel, v) { var m = document.querySelector(sel); if (m && v) m.setAttribute('content', v); }

  function setLang(next, persist) {
    lang = next === 'ar' ? 'ar' : 'fr';
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = S[lang][el.getAttribute('data-i18n')];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = S[lang][el.getAttribute('data-i18n-aria')];
      if (v != null) el.setAttribute('aria-label', v);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var v = S[lang][el.getAttribute('data-i18n-alt')];
      if (v != null) el.setAttribute('alt', v);
    });
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    var page = document.body.getAttribute('data-page') || 'home';
    var title = S[lang]['meta.' + page + '.title'];
    if (title) document.title = title;
    setMeta('meta[name="description"]', S[lang]['meta.' + page + '.description']);
    if (persist) { try { localStorage.setItem('unipocket-lang', lang); } catch (e) {} }
    listeners.forEach(function (fn) { fn(lang); });
  }

  /* Toast */
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* Links: [data-link="key"] gets its URL from config/links.js; empty means "coming soon" toast */
  function resolve(key) {
    var v = L[key];
    if (!v) return '';
    if (key === 'supportEmail' || (key === 'staffContact' && v.indexOf('@') > 0 && v.indexOf(':') < 0)) return 'mailto:' + v;
    return v;
  }
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var key = a.getAttribute('data-link'), url = resolve(key);
    if (url) {
      a.href = url;
      if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
      if (key === 'apk') a.setAttribute('download', '');
    } else {
      a.addEventListener('click', function (e) { e.preventDefault(); toast(t(key === 'googlePlay' || key === 'apk' ? 'toast.appSoon' : 'toast.linkSoon')); });
    }
  });
  if (L.appStore) {
    document.querySelectorAll('.store-btn.soon').forEach(function (s) {
      var a = document.createElement('a');
      a.className = 'store-btn'; a.href = L.appStore; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = s.innerHTML;
      var small = a.querySelector('[data-i18n="soon"]'); if (small) small.setAttribute('data-i18n', 'getOn');
      s.replaceWith(a);
    });
  }
  var socials = document.querySelector('[data-socials]');
  if (socials && L.socials) {
    var names = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', x: 'X', youtube: 'YouTube', tiktok: 'TikTok', whatsapp: 'WhatsApp' };
    Object.keys(L.socials).forEach(function (k) {
      if (!L.socials[k]) return;
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = L.socials[k]; a.target = '_blank'; a.rel = 'noopener'; a.textContent = names[k] || k;
      li.appendChild(a); socials.appendChild(li);
    });
    if (socials.children.length) socials.closest('[data-socials-wrap]').hidden = false;
  }
  document.querySelectorAll('[data-version]').forEach(function (el) { el.textContent = L.apkVersion || ''; });
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  /* Language toggle */
  document.querySelectorAll('.lang-toggle button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });
  document.querySelectorAll('[data-lang-switch]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(lang === 'ar' ? 'fr' : 'ar', true); });
  });

  /* Phone menu */
  var menuBtn = document.querySelector('.menu-btn'), sheet = document.getElementById('menuSheet');
  if (menuBtn && sheet) {
    var close = function (focusBtn) {
      if (sheet.hidden) return;
      sheet.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
      if (focusBtn) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = sheet.hidden;
      sheet.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
      if (open) { var f = sheet.querySelector('a'); if (f) f.focus(); }
    });
    sheet.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    document.addEventListener('click', function (e) { if (!sheet.hidden && !sheet.contains(e.target) && !menuBtn.contains(e.target)) close(false); });
    matchMedia('(min-width: 1101px)').addEventListener('change', function (m) { if (m.matches) close(false); });
  }

  /* Observers: reveal, hero pause, sticky bar */
  var hasIO = 'IntersectionObserver' in window;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });
  }
  var hero = document.getElementById('hero');
  if (hasIO && hero) new IntersectionObserver(function (es) { hero.classList.toggle('paused', !es[0].isIntersecting); }).observe(hero);
  var bar = document.getElementById('mCta'), heroStores = document.getElementById('heroStores'), finalCta = document.getElementById('telecharger');
  if (hasIO && bar && heroStores && finalCta) {
    var pastHero = false, atEnd = false;
    var upd = function () {
      var on = pastHero && !atEnd;
      bar.classList.toggle('show', on);
      bar.toggleAttribute('inert', !on);
      bar.setAttribute('aria-hidden', String(!on));
      document.body.classList.toggle('has-mcta', on);
    };
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; upd(); }).observe(heroStores);
    new IntersectionObserver(function (es) { atEnd = es[0].isIntersecting; upd(); }).observe(finalCta);
  }

  /* Clean address bar. A link to a section of the current page scrolls there
     without adding "#section" to the address. A "#section" or "?lang=" that
     arrives with the page (a link from another page, a search result) is
     applied once the page has loaded, then removed from the address. */
  function cleanUrl() {
    if (!location.hash && !location.search) return;
    try { history.replaceState(history.state, '', location.pathname); } catch (e) {}
  }
  function goTo(id, smooth) {
    var el = id && document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' });
    /* Move keyboard focus with the scroll, as a native jump to "#section" does */
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    return true;
  }
  document.addEventListener('click', function (e) {
    /* Runs after the per-link handlers: a "coming soon" link has already prevented its default */
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank') return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash.length < 2) return;
    if (goTo(decodeURIComponent(url.hash.slice(1)), true)) { e.preventDefault(); cleanUrl(); }
  });
  window.addEventListener('load', function () {
    if (location.hash.length > 1) goTo(decodeURIComponent(location.hash.slice(1)), false);
    cleanUrl();
  });

  /* Public API for the block scripts */
  window.Unipocket = {
    t: t,
    lang: function () { return lang; },
    toast: toast,
    onLang: function (fn) { listeners.push(fn); },
    reduceMotion: reduce
  };

  /* Init: ?lang= wins, then the saved choice, then the browser language.
     ?lang= is saved, because it is removed from the address after load
     (cleanUrl) and a reload must keep the language the visitor came in with. */
  var saved = null;
  try { saved = localStorage.getItem('unipocket-lang'); } catch (e) {}
  var initial = urlLang || saved || ((navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'fr');
  /* setLang runs after the block scripts register, so they render in the right language */
  document.addEventListener('DOMContentLoaded', function () { setLang(initial, !!urlLang); });
})();
