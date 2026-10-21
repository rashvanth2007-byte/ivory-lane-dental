/* ════════════════════════════════════════════════════════════════════════
   Site behaviour. You normally don't need to edit this file —
   client details live in js/config.js.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = window.SITE || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── 1. What the page claims: "features" in config.js ───────────────── */
  // data-if="prices" stays only while that switch is on, data-if="!prices" only while it's off
  var features = SITE.features || {};
  $$('[data-if]').forEach(function (el) {
    var rule = el.getAttribute('data-if');
    var wanted = rule.charAt(0) !== '!';
    if ((features[rule.replace('!', '')] !== false) === wanted) el.removeAttribute('data-if');
    else el.remove();
  });
  if (features.prices === false) $$('[data-price]').forEach(function (el) { el.textContent = 'Ask about fees'; });
  var doctorList = $('.doctors');
  if (doctorList) doctorList.classList.toggle('doctors--single', $$('.doctor', doctorList).length === 1);

  /* ── 1b. Fill in client details from config.js ──────────────────────── */
  var waNumber = String(SITE.whatsapp || '').replace(/\D/g, ''); // "+91 98765 43210" → "919876543210"
  function waLink(text) {
    return 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text || SITE.whatsappGreeting || '');
  }
  var mapsLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(SITE.mapQuery || '');

  // a setting that is present but left empty ("") removes what shows it, instead of
  // leaving the sample clinic's details on the page; a [data-site-row] wrapper goes with it
  function isBlank(key) { return Object.prototype.hasOwnProperty.call(SITE, key) && (SITE[key] === '' || SITE[key] == null); }
  function drop(el) { (el.closest('[data-site-row]') || el).remove(); }

  $$('[data-site]').forEach(function (el) {
    var key = el.getAttribute('data-site');
    if (SITE[key]) el.textContent = SITE[key];
    else if (isBlank(key)) drop(el);
  });

  var hrefs = {
    phone: { key: 'phoneRaw', url: SITE.phoneRaw && 'tel:' + SITE.phoneRaw },
    whatsapp: { key: 'whatsapp', url: waNumber && waLink() },
    email: { key: 'email', url: SITE.email && 'mailto:' + SITE.email },
    maps: { key: 'mapQuery', url: SITE.mapQuery && mapsLink }
  };
  $$('[data-site-href]').forEach(function (el) {
    var h = hrefs[el.getAttribute('data-site-href')];
    if (!h) return;
    if (h.url) el.setAttribute('href', h.url);
    else if (isBlank(h.key)) drop(el);
  });
  // icon-only call buttons get a name screen readers can announce
  $$('.header__phone').forEach(function (el) { if (SITE.phone) el.setAttribute('aria-label', 'Call ' + SITE.phone); });

  // demo links can name the first doctor and pick their sample photo
  var doctorImg = $('.doctor img');
  if (doctorImg && SITE.doctorPhoto) doctorImg.setAttribute('src', SITE.doctorPhoto);
  if (doctorImg && SITE.doctorName) doctorImg.setAttribute('alt', 'Portrait of ' + SITE.doctorName);

  var social = SITE.social || {};
  $$('[data-social]').forEach(function (el) {
    var url = social[el.getAttribute('data-social')];
    if (url) el.setAttribute('href', url); else el.remove();
  });
  // the reviews badge links to the Google profile; without one it stays as plain text
  $$('[data-site-href="google"]').forEach(function (el) {
    if (social.google) el.setAttribute('href', social.google);
    else if (social.google === '') { el.removeAttribute('href'); el.removeAttribute('target'); }
  });

  var map = $('[data-map]');
  if (map && SITE.mapQuery) {
    var mapSrc = 'https://www.google.com/maps?q=' + encodeURIComponent(SITE.mapQuery) + '&output=embed';
    if (map.getAttribute('src') !== mapSrc) map.setAttribute('src', mapSrc);
  } else if (map && isBlank('mapQuery')) {
    (map.closest('.map') || map).remove();
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ── 2. Theme ───────────────────────────────────────────────────────── */
  var THEMES = ['lagoon', 'sapphire', 'plum', 'forest'];
  var favicon = $('link[rel="icon"]');
  function setTheme(name) {
    name = String(name || '').toLowerCase();
    if (THEMES.indexOf(name) < 0) {
      if (name) console.warn('Unknown theme "' + name + '" in js/config.js; using "lagoon".');
      name = 'lagoon';
    }
    root.setAttribute('data-theme', name);
    $$('[data-set-theme]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-set-theme') === name);
    });
    // the favicon tile follows the theme's brand colour
    var brand = getComputedStyle(root).getPropertyValue('--brand').trim();
    if (favicon && /^#[0-9a-f]{3,8}$/i.test(brand)) {
      favicon.setAttribute('href', favicon.getAttribute('href').replace(/fill='(%23|#)[0-9a-fA-F]{3,8}'/, "fill='%23" + brand.slice(1) + "'"));
    }
  }
  setTheme(SITE.theme);
  var themer = $('[data-themer]');
  if (themer && SITE.showThemeSwitcher) {
    themer.hidden = false;
    themer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-theme]');
      if (b) setTheme(b.getAttribute('data-set-theme'));
    });
  }

  /* ── 2b. Languages: header menu + first-visit translate prompt ───────── */
  (function () {
    var langs = SITE.languages || [];
    var box = $('[data-lang]');
    if (!box || !langs.length) return;

    var menu = $('[data-lang-menu]', box);
    var btn = $('.lang__btn', box);
    var currentLabel = $('[data-lang-current]', box);
    var all = [{ code: 'en', label: 'English' }].concat(langs);
    var store = {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
    };
    var active = 'en';
    var widget = null; // promise for Google's hidden language <select>
    var dismissOffer = function () {};

    function loadWidget() {
      if (widget) return widget;
      widget = new Promise(function (resolve, reject) {
        window.googleTranslateElementInit = function () {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: langs.map(function (l) { return l.code; }).join(','),
            autoDisplay: false
          }, 'google_translate_element');
          var tries = 0;
          (function waitForSelect() {
            var select = $('#google_translate_element select');
            if (select && select.options.length > 1) return resolve(select);
            if (++tries > 100) return reject(new Error('Translate widget did not load'));
            setTimeout(waitForSelect, 100);
          })();
        };
        var script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.onerror = function () { reject(new Error('Translate script blocked')); };
        document.head.appendChild(script);
      });
      return widget;
    }

    // a short message under the header (used when translation can't load)
    function notice(text) {
      var n = document.createElement('div');
      n.className = 'translate-offer is-visible notranslate';
      n.setAttribute('role', 'status');
      n.innerHTML = '<svg aria-hidden="true"><use href="#i-globe"/></svg><p></p>';
      $('p', n).textContent = text;
      document.body.appendChild(n);
      setTimeout(function () { n.classList.remove('is-visible'); setTimeout(function () { n.remove(); }, 700); }, 4000);
    }

    function mark(code) {
      active = code;
      all.forEach(function (l) {
        if (l.code !== code) return;
        currentLabel.textContent = l.label;
        btn.setAttribute('aria-label', 'Language: ' + l.label);
      });
      $$('button', menu).forEach(function (b) {
        b.setAttribute('aria-current', String(b.getAttribute('data-code') === code));
      });
    }

    function setLanguage(code) {
      dismissOffer();
      if (code === active) return;
      if (code === 'en') {
        // going back to the original text is most reliable with a clean reload
        store.del('site-lang');
        window.location.reload();
        return;
      }
      store.set('site-lang', code);
      mark(code);
      loadWidget().then(function (select) {
        select.value = code;
        select.dispatchEvent(new Event('change'));
      }).catch(function () {
        widget = null; // allow a later retry
        store.del('site-lang');
        mark('en');
        notice('Translation is not available right now. Please check your connection and try again.');
      });
    }

    all.forEach(function (l) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-code', l.code);
      b.setAttribute('lang', l.code);
      b.textContent = l.label;
      li.appendChild(b); menu.appendChild(li);
    });
    box.hidden = false;
    mark('en');

    function toggle(open) {
      box.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { toggle(!box.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-code]');
      if (!b) return;
      toggle(false);
      setLanguage(b.getAttribute('data-code'));
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) toggle(false); });
    box.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !box.contains(e.relatedTarget)) toggle(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !box.classList.contains('is-open')) return;
      toggle(false);
      btn.focus(); // don't leave focus on a menu item that is now hidden
    });

    // returning visitor who already chose a language
    var saved = store.get('site-lang');
    if (saved && langs.some(function (l) { return l.code === saved; })) { setLanguage(saved); return; }

    // first visit: offer the visitor's own language if their browser lists one we support
    // adding ?lang=ta (or hi, te …) to the address previews the question for that language
    var preview = (window.location.search.match(/[?&]lang=([a-z]{2})/i) || [])[1];
    if (!preview && (!SITE.offerTranslation || store.get('site-lang-asked'))) return;
    var prefs = (preview ? [preview] : navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])
      .map(function (l) { return String(l).toLowerCase().split('-')[0]; });
    var match = null;
    prefs.some(function (p) {
      match = langs.filter(function (l) { return l.code === p && l.prompt; })[0] || null;
      return !!match;
    });
    if (!match) return;

    var offer = document.createElement('div');
    offer.className = 'translate-offer notranslate';
    offer.setAttribute('role', 'dialog');
    offer.setAttribute('aria-label', 'Translate this website');
    offer.innerHTML = '<svg aria-hidden="true"><use href="#i-globe"/></svg><p></p>' +
      '<div class="translate-offer__actions"><button type="button" class="translate-offer__yes"></button>' +
      '<button type="button" class="translate-offer__no">English</button></div>';
    $('p', offer).textContent = match.prompt;
    $('p', offer).setAttribute('lang', match.code);
    $('.translate-offer__yes', offer).textContent = match.label;
    // right after the header in the page, so keyboard users reach it where it appears
    var head = $('.header');
    document.body.insertBefore(offer, head ? head.nextSibling : document.body.firstChild);
    dismissOffer = function () {
      store.set('site-lang-asked', '1');
      offer.classList.remove('is-visible');
      dismissOffer = function () {};
    };
    $('.translate-offer__yes', offer).addEventListener('click', function () { setLanguage(match.code); });
    $('.translate-offer__no', offer).addEventListener('click', function () { dismissOffer(); });
    setTimeout(function () { if (offer.isConnected && active === 'en' && !store.get('site-lang-asked')) offer.classList.add('is-visible'); }, 1800);
  })();

  /* ── 3. Opening hours + live "open now" status ──────────────────────── */
  function fmt(t) {
    var p = t.split(':'), h = +p[0] % 24, m = p[1]; // "24:00" (closing at midnight) reads 12:00 AM
    return ((h % 12) || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }

  // the clinic's own day and time, so visitors in other time zones see the right status
  function clockIn(zone, d) {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
    var get = function (type) { return (parts.filter(function (p) { return p.type === type; })[0] || {}).value; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    var h = +get('hour') % 24, m = +get('minute');
    return day >= 0 && !isNaN(h) && !isNaN(m) ? { day: day, mins: h * 60 + m } : null;
  }
  function clinicClock() {
    var d = new Date();
    var zone = SITE.timeZone === undefined ? 'Asia/Kolkata' : SITE.timeZone;
    if (zone) {
      try { var c = clockIn(zone, d); if (c) return c; }
      catch (e) {
        console.warn('Unknown timeZone "' + zone + '" in js/config.js; using Asia/Kolkata.');
        try { var k = clockIn('Asia/Kolkata', d); if (k) return k; } catch (e2) {}
      }
    }
    return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
  }

  var slotCard = $('[data-next-slot]') && $('[data-next-slot]').closest('.float-card');

  if (SITE.hours && SITE.hours.length === 7) {
    var clock = clinicClock();
    var todayIndex = clock.day;
    var today = SITE.hours[todayIndex];
    var nowMins = clock.mins;
    var isOpen = !today.closed && nowMins >= mins(today.open) && nowMins < mins(today.close);

    var list = $('[data-hours]');
    if (list) {
      list.innerHTML = '';
      // Monday first
      [1, 2, 3, 4, 5, 6, 0].forEach(function (i) {
        var d = SITE.hours[i];
        var li = document.createElement('li');
        var a = document.createElement('span'); a.textContent = d.day;
        if (i === todayIndex) {
          li.className = 'is-today';
          var tag = document.createElement('span'); tag.className = 'hours__today'; tag.textContent = 'Today';
          a.appendChild(document.createTextNode(' ')); a.appendChild(tag);
        }
        var b = document.createElement('span'); b.textContent = d.closed ? 'Closed' : fmt(d.open) + ' – ' + fmt(d.close);
        li.appendChild(a); li.appendChild(b); list.appendChild(li);
      });
    }

    // "Next available" card: earliest bookable slot based on the clinic hours
    var slotEl = $('[data-next-slot]');
    if (slotEl) {
      var lead = SITE.slotLeadMinutes == null ? 60 : SITE.slotLeadMinutes;
      var len = SITE.slotLengthMinutes || 30;
      var slotText = '';
      for (var ahead = 0; ahead < 8 && !slotText; ahead++) {
        var dayIndex = (todayIndex + ahead) % 7;
        var day = SITE.hours[dayIndex];
        if (day.closed) continue;
        var start = mins(day.open);
        if (ahead === 0) start = Math.max(start, Math.ceil((nowMins + lead) / len) * len);
        if (start + len > mins(day.close)) continue; // no full slot left that day
        var hh = Math.floor(start / 60), mm = start % 60;
        var label = ahead === 0 ? 'Today' : ahead === 1 ? 'Tomorrow' : day.day;
        slotText = label + ', ' + fmt(hh + ':' + (mm < 10 ? '0' : '') + mm);
      }
      if (slotText) slotEl.textContent = slotText;
      else if (slotCard) slotCard.style.display = 'none'; // never leave the sample time showing
    }

    var statusText;
    if (isOpen) statusText = 'Open now · until ' + fmt(today.close);
    else if (!today.closed && nowMins < mins(today.open)) statusText = 'Opens today at ' + fmt(today.open);
    else {
      statusText = 'Closed now';
      // the next day the clinic opens, even if that is several days away
      for (var n = 1; n <= 7; n++) {
        var next = SITE.hours[(todayIndex + n) % 7];
        if (next.closed) continue;
        statusText += ' · opens ' + fmt(next.open) + (n === 1 ? ' tomorrow' : ' on ' + next.day);
        break;
      }
    }
    $$('[data-open-status]').forEach(function (el) { el.textContent = statusText; });
    $$('[data-open-dot]').forEach(function (el) { el.classList.toggle('is-closed', !isOpen); });
    $$('[data-open-badge]').forEach(function (el) {
      el.textContent = isOpen ? 'Open now' : 'Closed now';
      el.classList.toggle('is-closed', !isOpen);
    });
  } else {
    // without a full week of hours the live status can't be worked out, so hide the sample text
    if (SITE.hours) console.warn('js/config.js: "hours" needs exactly 7 entries, Sunday first.');
    $$('[data-open-status], [data-open-dot], [data-open-badge], .hours').forEach(function (el) { el.style.display = 'none'; });
    if (slotCard) slotCard.style.display = 'none';
  }

  /* ── 4. Image fallback ──────────────────────────────────────────────── */
  $$('img').forEach(function (img) {
    function failed() { if (img.parentElement) img.parentElement.classList.add('img-failed'); }
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) failed();
    img.addEventListener('error', failed);
  });

  /* ── 5. Page-load animation ─────────────────────────────────────────── */
  function markLoaded() { document.body.classList.add('is-loaded'); }
  requestAnimationFrame(function () { requestAnimationFrame(markLoaded); });
  // rAF doesn't run in a background tab, so make sure the hero is never left hidden
  setTimeout(markLoaded, 1500);

  /* ── 6. Header, scroll progress, floating buttons ───────────────────── */
  var header = $('.header');
  var progress = $('.scroll-progress');
  var fab = $('.fab');
  var mobileBar = $('.mobile-bar');
  var bookSection = $('#book');
  var parallaxEls = reduceMotion ? [] : $$('[data-parallax]');
  var steps = $('[data-steps]');
  var stepEls = steps ? $$('.step', steps) : [];
  var ticking = false;

  function onScroll() {
    // read every measurement first, then write, so the browser lays out the page once per frame
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    var headerH = header.offsetHeight;
    var br = bookSection ? bookSection.getBoundingClientRect() : null;
    var para = parallaxEls.map(function (el) {
      var r = el.getBoundingClientRect();
      var current = el._parallax || 0; // the rect includes our own offset; measure without it
      return { el: el, top: r.top - current, height: r.height };
    });
    var sr = steps ? steps.getBoundingClientRect() : null;
    var stepTops = stepEls.map(function (s) { return s.getBoundingClientRect().top; });

    header.classList.toggle('is-scrolled', y > 12);
    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    var pastHero = y > vh * 0.600;
    // the booking section has its own form, call and WhatsApp links, so the floating
    // "Call / WhatsApp / Book Now" bar and the WhatsApp button step aside while its
    // content is on screen (not just its empty bottom edge above the footer)
    var atBooking = br ? br.top < vh - 120 && br.bottom > headerH + 160 : false;
    var showFloats = pastHero && !atBooking;
    if (fab) fab.classList.toggle('is-visible', showFloats);
    if (mobileBar) mobileBar.classList.toggle('is-visible', showFloats);
    if (themer) themer.classList.toggle('is-tucked', pastHero);

    para.forEach(function (p) {
      if (p.top + p.height < -100 || p.top > vh + 100) return;
      var offset = (p.top + p.height / 2 - vh / 2) * parseFloat(p.el.getAttribute('data-parallax'));
      p.el._parallax = offset;
      p.el.style.translate = '0 ' + offset.toFixed(1) + 'px';
    });

    if (sr) {
      var prog = Math.min(1, Math.max(0, (vh * 0.620 - sr.top) / sr.height));
      steps.style.setProperty('--progress', prog.toFixed(3));
      stepEls.forEach(function (step, i) { step.classList.toggle('is-active', stepTops[i] < vh * 0.620); });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Large name in the footer: a long clinic name shrinks to fit on one line */
  var footerWord = $('.footer__word');
  function fitFooterWord() {
    footerWord.style.removeProperty('--fit');
    if (!footerWord.clientWidth) return; // not laid out (e.g. a background tab): leave it at full size
    var ratio = footerWord.clientWidth / footerWord.scrollWidth;
    if (ratio < 1) footerWord.style.setProperty('--fit', Math.max(0.3, ratio * 0.96).toFixed(3));
  }
  if (footerWord) {
    fitFooterWord();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFooterWord);
    window.addEventListener('resize', fitFooterWord);
  }

  /* Logo (and any other link to #top) scrolls back to the very top */
  $$('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      // drop the old #section from the address bar and the menu highlight
      if (window.location.hash && history.replaceState) history.replaceState(null, '', window.location.pathname + window.location.search);
      $$('.nav a.is-active').forEach(function (l) { l.classList.remove('is-active'); });
      // keyboard users continue from the top of the page, not from the footer
      var topLogo = $('.header .logo');
      if (topLogo && a !== topLogo) topLogo.focus({ preventScroll: true });
    });
  });

  /* ── 7. Mobile menu ─────────────────────────────────────────────────── */
  var burger = $('.burger');
  var nav = $('#nav');
  function toggleMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      toggleMenu(open);
      // the links come before the button in the page, so move keyboard focus into the menu
      // (the CSS makes the open menu visible at once, so it can take focus straight away)
      if (open) { var first = $('a', nav); if (first) first.focus({ preventScroll: true }); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) toggleMenu(false); });
    // the menu is a small dropdown, so a tap anywhere else closes it
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) toggleMenu(false);
    });
    // ...and so does tabbing out of it
    nav.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (nav.classList.contains('is-open') && to && !nav.contains(to) && to !== burger) toggleMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
      toggleMenu(false);
      burger.focus();
    });
  }

  /* ── 8. Scroll reveal + active nav link ─────────────────────────────── */
  var reveals = $$('.reveal');
  function finish(el) {
    // drop the reveal classes so each component's own hover transitions take over
    el.classList.remove('reveal', 'is-in');
  }
  var revealOptions = { threshold: 0.120, rootMargin: '0px 0px -6% 0px' };
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        io.unobserve(el);
        var delay = (parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0) * 80;
        setTimeout(function () { finish(el); }, 1000 + delay);
      });
    }, revealOptions);
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(finish);
  }

  if ('IntersectionObserver' in window) {
    var links = $$('.nav a[href^="#"]:not(.btn)');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ── 9. Count-up numbers ────────────────────────────────────────────── */
  function show(el, value) {
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN');
  }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var start = null, duration = 1800;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      show(el, target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    // each group of numbers starts counting together, as its row fades in
    // (the real numbers stay in the HTML, so the page reads correctly without JavaScript)
    var groups = $$('.stats').filter(function (g) { return $('[data-count]', g); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        $$('[data-count]', entry.target).forEach(runCounter);
        cio.unobserve(entry.target);
      });
    }, revealOptions);
    groups.forEach(function (g) {
      $$('[data-count]', g).forEach(function (el) { show(el, 0); });
      cio.observe(g);
    });
  }

  /* ── 10. Endless treatment marquee ──────────────────────────────────── */
  $$('.marquee__track').forEach(function (track) {
    if (reduceMotion) return;
    $$(':scope > *', track).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    // gap between the two halves must match the flex gap for a seamless loop
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.style.paddingRight = gap + 'px';
  });

  // a visible control to pause everything that moves on its own (WCAG 2.2.2)
  var motionToggle = $('[data-motion-toggle]');
  if (motionToggle) {
    if (reduceMotion) motionToggle.hidden = true;
    motionToggle.addEventListener('click', function () {
      var paused = root.classList.toggle('is-motion-paused');
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.setAttribute('aria-label', paused ? 'Play moving text' : 'Pause moving text');
    });
  }

  /* ── 11. Spotlight that follows the cursor on service cards ─────────── */
  $$('.service').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── 12. FAQ accordion ──────────────────────────────────────────────── */
  $$('[data-faq]').forEach(function (faq) {
    // closed answers are only collapsed visually, so keep screen readers out of them too
    function sync(item) { $('.faq__a', item).inert = !item.classList.contains('is-open'); }
    $$('.faq__item', faq).forEach(sync);
    faq.addEventListener('click', function (e) {
      var q = e.target.closest('.faq__q');
      if (!q) return;
      var item = q.parentElement;
      var open = !item.classList.contains('is-open');
      $$('.faq__item', faq).forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
        sync(other);
      });
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', String(open));
      sync(item);
    });
  });

  /* ── 13. Booking form → WhatsApp (or a form endpoint) ───────────────── */
  var form = $('[data-booking]');
  if (form) {
    var status = $('.form__status', form);
    var dateInput = form.elements.date;
    function setMinDate() {
      if (!dateInput) return;
      var d = new Date();
      dateInput.min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    setMinDate();
    var submitBtn = $('button[type="submit"]', form);
    if (SITE.formEndpoint) {
      submitBtn.classList.remove('btn--accent');
      submitBtn.classList.add('btn--primary');
      submitBtn.textContent = 'Request an Appointment';
    }

    // an Indian mobile (6–9 then 9 digits) or a landline with its STD code,
    // with or without +91 / 0, spaces, dashes or brackets
    function validPhone(value) {
      if (!/^\+?[0-9\s()-]+$/.test(value)) return false;
      var d = value.replace(/\D/g, '');
      if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
      else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
      return d.length === 10 && !/^(\d)\1{9}$/.test(d) && (/^[6-9]/.test(d) || /^[1-5]/.test(d));
    }
    function flag(input, valid) {
      input.closest('.field').classList.toggle('has-error', !valid);
      if (valid) { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
      else { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', status.id); }
    }
    function joinAnd(parts) {
      return parts.length > 1 ? parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1] : parts[0];
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitBtn.disabled) return;
      setMinDate(); // the page may have been open since yesterday
      var name = form.elements.name, phone = form.elements.phone, date = dateInput;
      var nameOk = name.value.trim() !== '';
      var phoneOk = validPhone(phone.value.trim());
      // a half-typed date reads as "" but is flagged as bad input by the browser
      var dateOk = !date || (!(date.validity && date.validity.badInput) && (!date.value || !date.min || date.value >= date.min));
      flag(name, nameOk); flag(phone, phoneOk); if (date) flag(date, dateOk);
      var problems = [];
      if (!nameOk && !phoneOk) problems.push('enter your name and a valid mobile number');
      else if (!nameOk) problems.push('enter your name');
      else if (!phoneOk) problems.push('enter a valid mobile number');
      if (!dateOk) problems.push('choose today or a later date');
      status.classList.toggle('is-error', problems.length > 0);
      if (problems.length) {
        // write the message first so screen readers hear it along with the field
        status.textContent = 'Please ' + joinAnd(problems) + '.';
        (!nameOk ? name : !phoneOk ? phone : date).focus();
        return;
      }

      var data = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        treatment: form.elements.treatment.value,
        date: date ? date.value : '',
        time: form.elements.time.value,
        message: form.elements.message.value.trim()
      };

      if (SITE.formEndpoint) {
        status.textContent = 'Sending…';
        submitBtn.disabled = true; // one request per tap
        fetch(SITE.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          status.textContent = 'Thank you, ' + data.name + '. We will contact you shortly to confirm your appointment.';
        }).catch(function () {
          status.classList.add('is-error');
          status.textContent = 'Sorry, your request could not be sent. Please call us on ' + (SITE.phone || 'the clinic number') + '.';
        }).then(function () { submitBtn.disabled = false; });
        return;
      }

      if (!waNumber) {
        status.classList.add('is-error');
        status.textContent = 'Online booking is not set up yet. Please call us on ' + (SITE.phone || 'the clinic number') + '.';
        return;
      }

      var picked = data.date ? new Date(data.date + 'T00:00') : null;
      var dateOpts = { weekday: 'short', day: 'numeric', month: 'short' };
      if (picked && picked.getFullYear() !== new Date().getFullYear()) dateOpts.year = 'numeric';
      var niceDate = picked ? picked.toLocaleDateString('en-IN', dateOpts) : 'Earliest available';
      var lines = [
        'Hello ' + (SITE.legalName || SITE.name || '') + ', I would like to book an appointment.',
        '',
        'Name: ' + data.name,
        'Mobile: ' + data.phone,
        'Treatment: ' + data.treatment,
        'Preferred date: ' + niceDate,
        'Preferred time: ' + data.time
      ];
      if (data.message) lines.push('Note: ' + data.message);

      status.textContent = 'Opening WhatsApp with your details…';
      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    });

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field && field.classList.contains('has-error')) {
        field.classList.remove('has-error');
        var input = $('input, select, textarea', field);
        if (input) { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
      }
      // once nothing is marked wrong any more, clear the red message too
      if (status.classList.contains('is-error') && !$('.has-error', form)) {
        status.classList.remove('is-error');
        status.textContent = '';
      }
    });
  }
})();
