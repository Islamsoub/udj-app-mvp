/* Unipocket landing: decorative student-card QR demo.
   Draws a random 25×25 pattern (not a real QR code) and redraws it every 60s with a countdown.
   It only ticks while the card is on screen. */
(function () {
  var svgs = document.querySelectorAll('[data-qr]');
  if (!svgs.length) return;
  var timer = document.getElementById('qrTimer'), bar = document.getElementById('ringBar'), card = document.querySelector('.idcard');
  var N = 25, remaining = 60, tick = null;
  function draw(svg) {
    var out = ['<rect width="25" height="25" fill="#fff"/>'], d = '';
    function inFinder(x, y) { return (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9); }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (!inFinder(x, y) && Math.random() < 0.48) d += 'M' + x + ' ' + y + 'h1.02v1.02h-1.02z';
    }
    [[0, 0], [N - 7, 0], [0, N - 7]].forEach(function (p) {
      d += 'M' + p[0] + ' ' + p[1] + 'h7v7h-7zM' + (p[0] + 1) + ' ' + (p[1] + 1) + 'v5h5v-5zM' + (p[0] + 2) + ' ' + (p[1] + 2) + 'h3v3h-3z';
    });
    out.push('<path fill="#0A3D2E" fill-rule="evenodd" d="' + d + '"/>');
    svg.innerHTML = out.join('');
  }
  svgs.forEach(draw);
  function render() {
    if (timer) timer.textContent = '0:' + String(remaining).padStart(2, '0');
    if (bar) bar.style.transform = 'scaleX(' + (remaining / 60) + ')';
  }
  function step() {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 60;
      svgs.forEach(function (q) { q.classList.add('swap'); setTimeout(function () { draw(q); q.classList.remove('swap'); }, 200); });
    }
    render();
  }
  render();
  function start() { if (!tick) tick = setInterval(step, 1000); }
  function stop() { clearInterval(tick); tick = null; }
  if ('IntersectionObserver' in window && card) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(card);
  } else start();
})();
