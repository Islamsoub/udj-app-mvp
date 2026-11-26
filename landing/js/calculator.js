/* Unipocket landing: grade calculator demo. Needed exam mark = (target − wCC × CC) ÷ wExam */
(function () {
  var U = window.Unipocket; if (!U) return;
  var cc = document.getElementById('cc'), target = document.getElementById('target');
  if (!cc || !target) return;
  var wCC = 0.4;
  var out = {
    cc: document.getElementById('ccOut'), target: document.getElementById('targetOut'),
    box: document.getElementById('result'), big: document.getElementById('need'), formula: document.getElementById('formula')
  };
  function r2(n) { return Math.round(n * 100) / 100; }
  function update() {
    var c = +cc.value, g = +target.value, wEx = r2(1 - wCC);
    var need = (g - wCC * c) / wEx;
    out.cc.textContent = c; out.target.textContent = g;
    out.box.classList.remove('warn', 'bad', 'done');
    if (need > 20) { out.box.classList.add('bad'); out.big.textContent = U.t('calc.impossible'); }
    else if (need <= 0) { out.box.classList.add('done'); out.big.textContent = U.t('calc.acquired'); }
    else {
      out.big.textContent = (Math.ceil(need * 10) / 10).toFixed(1) + ' / 20';
      if (need >= 15) out.box.classList.add('warn');
    }
    out.formula.textContent = '(' + g + ' − ' + wCC + ' × ' + c + ') ÷ ' + wEx + ' = ' + r2(need);
  }
  document.querySelectorAll('.weights button').forEach(function (b, i, all) {
    b.addEventListener('click', function () {
      wCC = +b.getAttribute('data-w');
      all.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      update();
    });
    b.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      if (document.documentElement.dir === 'rtl' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) d = -d;
      e.preventDefault();
      var n = all[(i + d + all.length) % all.length]; n.click(); n.focus();
    });
  });
  cc.addEventListener('input', update);
  target.addEventListener('input', update);
  U.onLang(update);
})();
