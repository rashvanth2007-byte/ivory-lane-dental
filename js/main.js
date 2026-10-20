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

  /* ── 1. Fill in client details from config.js ───────────────────────── */
  function waLink(text) {
    return 'https://wa.me/' + (SITE.whatsapp || '') + '?text=' + encodeURIComponent(text || SITE.whatsappGreeting || '');
  }
  var mapsLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(SITE.mapQuery || '');

  $$('[data-site]').forEach(function (el) {
    var value = SITE[el.getAttribute('data-site')];
    if (value) el.textContent = value;
  });

  var hrefs = {
    phone: SITE.phoneRaw && 'tel:' + SITE.phoneRaw,
    whatsapp: SITE.whatsapp && waLink(),
    email: SITE.email && 'mailto:' + SITE.email,
    maps: SITE.mapQuery && mapsLink,
    google: SITE.social && SITE.social.google
  };
  $$('[data-site-href]').forEach(function (el) {
    var href = hrefs[el.getAttribute('data-site-href')];
    if (href) el.setAttribute('href', href);
  });

  $$('[data-social]').forEach(function (el) {
    var url = SITE.social && SITE.social[el.getAttribute('data-social')];
    if (url) el.setAttribute('href', url); else el.remove();
  });

  var map = $('[data-map]');
  if (map && SITE.mapQuery) {
    var mapSrc = 'https://www.google.com/maps?q=' + encodeURIComponent(SITE.mapQuery) + '&output=embed';
    if (map.getAttribute('src') !== mapSrc) map.setAttribute('src', mapSrc);
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ── 2. Theme ───────────────────────────────────────────────────────── */
  function setTheme(name) {
    root.setAttribute('data-theme', name);
    $$('[data-set-theme]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-set-theme') === name);
    });
  }
  setTheme(SITE.theme || 'lagoon');
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

    function mark(code) {
      active = code;
      all.forEach(function (l) { if (l.code === code) currentLabel.textContent = l.label; });
      $$('button', menu).forEach(function (b) {
        b.setAttribute('aria-current', String(b.getAttribute('data-code') === code));
      });
    }

    function setLanguage(code) {
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
        store.del('site-lang');
        mark('en');
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
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });

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
    document.body.appendChild(offer);
    function close() { store.set('site-lang-asked', '1'); offer.classList.remove('is-visible'); }
    $('.translate-offer__yes', offer).addEventListener('click', function () { close(); setLanguage(match.code); });
    $('.translate-offer__no', offer).addEventListener('click', close);
    setTimeout(function () { offer.classList.add('is-visible'); }, 1800);
  })();

  /* ── 3. Opening hours + live "open now" status ──────────────────────── */
  function fmt(t) {
    var p = t.split(':'), h = +p[0], m = p[1];
    return ((h % 12) || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }

  if (SITE.hours && SITE.hours.length === 7) {
    var now = new Date();
    var today = SITE.hours[now.getDay()];
    var nowMins = now.getHours() * 60 + now.getMinutes();
    var isOpen = !today.closed && nowMins >= mins(today.open) && nowMins < mins(today.close);

    var list = $('[data-hours]');
    if (list) {
      list.innerHTML = '';
      // Monday first
      [1, 2, 3, 4, 5, 6, 0].forEach(function (i) {
        var d = SITE.hours[i];
        var li = document.createElement('li');
        if (i === now.getDay()) li.className = 'is-today';
        var a = document.createElement('span'); a.textContent = d.day;
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
        var dayIndex = (now.getDay() + ahead) % 7;
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
    }

    var statusText;
    if (isOpen) statusText = 'Open now · until ' + fmt(today.close);
    else if (!today.closed && nowMins < mins(today.open)) statusText = 'Opens today at ' + fmt(today.open);
    else {
      var next = SITE.hours[(now.getDay() + 1) % 7];
      statusText = next.closed ? 'Closed now' : 'Closed now · opens ' + fmt(next.open) + ' tomorrow';
    }
    $$('[data-open-status]').forEach(function (el) { el.textContent = statusText; });
    $$('[data-open-dot]').forEach(function (el) { el.classList.toggle('is-closed', !isOpen); });
    $$('[data-open-badge]').forEach(function (el) {
      el.textContent = isOpen ? 'Open now' : 'Closed now';
      el.classList.toggle('is-closed', !isOpen);
    });
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
  var parallaxEls = reduceMotion ? [] : $$('[data-parallax]');
  var steps = $('[data-steps]');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;

    header.classList.toggle('is-scrolled', y > 12);
    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    var showFloats = y > vh * 0.600;
    if (fab) fab.classList.toggle('is-visible', showFloats);
    if (mobileBar) mobileBar.classList.toggle('is-visible', showFloats);
    if (themer) themer.classList.toggle('is-tucked', showFloats);

    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-parallax'));
      el.style.translate = '0 ' + offset.toFixed(1) + 'px';
    });

    if (steps) {
      var sr = steps.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.620 - sr.top) / sr.height));
      steps.style.setProperty('--progress', p.toFixed(3));
      $$('.step', steps).forEach(function (step) {
        step.classList.toggle('is-active', step.getBoundingClientRect().top < vh * 0.620);
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Logo (and any other link to #top) scrolls back to the very top */
  $$('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
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
    burger.addEventListener('click', function () { toggleMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) toggleMenu(false); });
    // the menu is a small dropdown, so a tap anywhere else closes it
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) toggleMenu(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleMenu(false); });
  }

  /* ── 8. Scroll reveal + active nav link ─────────────────────────────── */
  var reveals = $$('.reveal');
  function finish(el) {
    // drop the reveal classes so each component's own hover transitions take over
    el.classList.remove('reveal', 'is-in');
  }
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
    }, { threshold: 0.120, rootMargin: '0px 0px -6% 0px' });
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
  var counters = $$('[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var start = null, duration = 1800;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - t, 4);
      var value = target * eased;
      el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN');
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.600 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ── 10. Endless rails (treatment marquee + reviews) ────────────────── */
  $$('.marquee__track, .review-rail__track').forEach(function (track) {
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

  /* ── 11. Spotlight that follows the cursor on service cards ─────────── */
  $$('.service').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── 12. Before / after slider ──────────────────────────────────────── */
  $$('.compare').forEach(function (box) {
    var range = $('.compare__range', box);
    function set(v) { box.style.setProperty('--pos', v + '%'); }
    range.addEventListener('input', function () { set(range.value); });
    // a gentle nudge the first time it scrolls into view, to hint that it drags
    if ('IntersectionObserver' in window && !reduceMotion) {
      var hinted = false;
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting || hinted) return;
        hinted = true; obs.disconnect();
        var t0 = null;
        function nudge(ts) {
          if (t0 === null) t0 = ts;
          var t = (ts - t0) / 1600;
          if (t >= 1 || range.matches(':active')) { return; }
          var v = 50 + Math.sin(t * Math.PI * 2) * 16 * (1 - t);
          range.value = v; set(v);
          requestAnimationFrame(nudge);
        }
        setTimeout(function () { requestAnimationFrame(nudge); }, 700);
      }, { threshold: 0.600 }).observe(box);
    }
  });

  /* ── 13. FAQ accordion ──────────────────────────────────────────────── */
  $$('[data-faq]').forEach(function (faq) {
    faq.addEventListener('click', function (e) {
      var q = e.target.closest('.faq__q');
      if (!q) return;
      var item = q.parentElement;
      var open = !item.classList.contains('is-open');
      $$('.faq__item', faq).forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ── 14. Booking form → WhatsApp (or a form endpoint) ───────────────── */
  var form = $('[data-booking]');
  if (form) {
    var status = $('.form__status', form);
    var dateInput = form.elements.date;
    if (dateInput) {
      var d = new Date();
      var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      dateInput.min = iso;
    }
    if (SITE.formEndpoint) {
      var submitBtn = $('button[type="submit"]', form);
      submitBtn.classList.remove('btn--accent');
      submitBtn.classList.add('btn--primary');
      submitBtn.textContent = 'Request Appointment';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone;
      var ok = true;
      [name, phone].forEach(function (input) {
        var valid = input.value.trim() !== '' && input.checkValidity();
        input.closest('.field').classList.toggle('has-error', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      status.classList.toggle('is-error', !ok);
      if (!ok) { status.textContent = 'Please enter your name and a valid mobile number.'; return; }

      var data = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        treatment: form.elements.treatment.value,
        date: form.elements.date.value,
        time: form.elements.time.value,
        message: form.elements.message.value.trim()
      };

      if (SITE.formEndpoint) {
        status.textContent = 'Sending…';
        fetch(SITE.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          status.textContent = 'Thank you, ' + data.name + '. We will call you shortly to confirm your appointment.';
        }).catch(function () {
          status.classList.add('is-error');
          status.textContent = 'Sorry, your request could not be sent. Please call us on ' + (SITE.phone || 'the clinic number') + '.';
        });
        return;
      }

      var niceDate = data.date
        ? new Date(data.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
        : 'Earliest available';
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
      if (field) field.classList.remove('has-error');
    });
  }
})();
