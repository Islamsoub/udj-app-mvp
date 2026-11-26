/* Unipocket: app screens tour page (ecrans.html).
   Swaps every screenshot to the current language: FR or AR files, falling back to FR when a screen has no AR version.
   The page's text lives in i18n/strings.js (keys navScreens, meta.ecrans.*, ecr.*).
   Load after js/main.js. main.js applies the language on DOMContentLoaded, which runs after this deferred script. */
(function () {
  /* Screenshots: <picture data-shot="app-home" data-langs="fr ar" data-sizes="384x836">.
     File pattern: assets/screenshots/ecrans/{shot}-{lang}-{WxH}.webp/.png. data-sizes lists WebP widths, largest first; the PNG fallback is the smallest size. */
  var DIR = 'assets/screenshots/ecrans/';
  function swap(lang) {
    document.querySelectorAll('picture[data-shot]').forEach(function (p) {
      var langs = (p.getAttribute('data-langs') || 'fr').split(' ');
      var l = langs.indexOf(lang) >= 0 ? lang : 'fr';
      if (p.getAttribute('data-cur') === l) return;
      var shot = p.getAttribute('data-shot'), sizes = p.getAttribute('data-sizes').split(' ');
      var src = p.querySelector('source'), img = p.querySelector('img');
      src.srcset = sizes.map(function (s) { return DIR + shot + '-' + l + '-' + s + '.webp ' + s.split('x')[0] + 'w'; }).join(', ');
      img.src = DIR + shot + '-' + l + '-' + sizes[sizes.length - 1] + '.png';
      p.setAttribute('data-cur', l);
    });
  }
  if (window.Unipocket && window.Unipocket.onLang) window.Unipocket.onLang(swap);
})();
