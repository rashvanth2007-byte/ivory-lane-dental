/* Fills the clinic's details and theme into privacy.html and terms.html from js/config.js. */
(function () {
  'use strict';
  var SITE = window.SITE || {};
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var theme = String(SITE.theme || '').toLowerCase();
  if (['lagoon', 'sapphire', 'plum', 'forest'].indexOf(theme) >= 0) document.documentElement.setAttribute('data-theme', theme);

  // as on the main page, a detail set to "" removes what shows it (and its [data-site-row] wrapper)
  $$('[data-site]').forEach(function (el) {
    var key = el.getAttribute('data-site');
    if (SITE[key]) el.textContent = SITE[key];
    else if (Object.prototype.hasOwnProperty.call(SITE, key) && (SITE[key] === '' || SITE[key] == null)) (el.closest('[data-site-row]') || el).remove();
  });
  var hrefs = {
    phone: SITE.phoneRaw && 'tel:' + SITE.phoneRaw,
    email: SITE.email && 'mailto:' + SITE.email
  };
  $$('[data-site-href]').forEach(function (el) {
    var href = hrefs[el.getAttribute('data-site-href')];
    if (href) el.setAttribute('href', href);
  });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
