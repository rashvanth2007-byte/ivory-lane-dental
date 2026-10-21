/* ════════════════════════════════════════════════════════════════════════
   Demo links: show a prospective client the site with their own clinic's
   name, before any file is edited. Works only while demoLinks is true in
   js/config.js; set that to false before a client's site goes live.

   Make these links with demo.html, or by hand, e.g.
   index.html?name=Sree's+Smile+Care&town=Rasipuram&phone=9876543210&specialists=0

     name      clinic name in the logo (needed for the details below)
     sub       small text under the name (default "Dental Clinic"; sub= for none)
     town      town or city              area     locality within the town
     address   street address            phone    clinic phone (a mobile also gets WhatsApp)
     wa        WhatsApp number, if it isn't the phone above
     doctor    dentist's name            qual     their qualification, e.g. BDS, MDS (Endodontics)
     photo     man | woman: sample photo on the dentist's card (for single-dentist demos)
     theme     lagoon | sapphire | plum | forest
     specialists, equipment, prices   0 switches that part off (see "features" in config.js)
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = window.SITE;
  if (!SITE || !SITE.demoLinks || !window.URLSearchParams) return;

  var query = new URLSearchParams(window.location.search);
  function param(key) {
    var value = query.get(key);
    return value === null ? null : value.replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  function setIf(key, value) { if (value) SITE[key] = value; }

  // the switches work on their own too: ?specialists=0 previews the single-dentist wording
  SITE.features = Object.assign({}, SITE.features);
  ['specialists', 'equipment', 'prices'].forEach(function (key) {
    var value = param(key);
    if (value !== null) SITE.features[key] = !/^(0|off|no|false)$/i.test(value);
  });
  setIf('theme', param('theme'));

  var name = param('name');
  if (!name) return;

  var sub = param('sub');
  if (sub === null) sub = 'Dental Clinic';
  // "Sri Saai Dental Clinic" over a small "Dental Clinic" would say it twice
  var at = sub ? name.toLowerCase().lastIndexOf(sub.toLowerCase()) : -1;
  if (at > 0 && at + sub.length === name.length) name = name.slice(0, at).replace(/[\s,–-]+$/, '');
  var fullName = sub && name.toLowerCase().indexOf(sub.toLowerCase()) < 0 ? name + ' ' + sub : name;
  var area = param('area') || '';
  var town = param('town') || '';
  if (!town) { town = area || 'Tamil Nadu'; area = ''; }
  var place = [area, town].filter(Boolean).join(', ');
  var mapQuery = fullName + ', ' + place;
  var address = param('address');

  Object.assign(SITE, {
    name: name,
    suffix: sub,
    legalName: fullName,
    area: area,
    city: town,
    addressLine1: address || place,
    addressLine2: (address || town === 'Tamil Nadu') ? '' : 'Tamil Nadu',
    landmark: '',
    email: '',     // the sample address would give the demo away
    mapQuery: mapQuery,
    social: Object.assign({}, SITE.social, {
      // "Read reviews on Google" opens the clinic's own listing
      google: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery)
    })
  });

  // an Indian number in any common format, as its 10 digits ("" if it isn't one)
  function tenDigits(value) {
    var d = (value || '').replace(/\D/g, '');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return /^[1-9]\d{9}$/.test(d) ? d : '';
  }
  var isMobile = function (d) { return /^[6-9]/.test(d); };
  var phone = tenDigits(param('phone'));
  if (phone) {
    // mobiles read +91 98765 43210; a landline keeps the STD-code spacing it was given in
    SITE.phone = isMobile(phone) ? '+91 ' + phone.slice(0, 5) + ' ' + phone.slice(5) : param('phone');
    SITE.phoneRaw = '+91' + phone;
  }
  // WhatsApp: the wa number if given, otherwise the phone when it's a mobile
  var wa = tenDigits(param('wa'));
  if (!isMobile(wa)) wa = phone;
  if (isMobile(wa)) SITE.whatsapp = '91' + wa;

  // a named dentist doesn't inherit the sample's qualification and special interest
  if (param('doctor')) {
    SITE.doctorName = param('doctor');
    SITE.doctorQualification = param('qual') || '';
    SITE.doctorNote = '';
  }
  // the second sample doctor is a man, the first a woman
  var photos = document.querySelectorAll('.doctor img');
  if (param('photo') === 'man' && photos[1]) SITE.doctorPhoto = photos[1].getAttribute('src');

  var hero = document.querySelector('.hero__copy'); // only on the main page
  document.title = hero ? fullName + ' | Dental Clinic in ' + place : document.title.replace(/\|.*$/, '| ' + fullName);
  var robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex';
  document.head.appendChild(robots);

  // the privacy and terms pages (and the way back) keep the demo details
  Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
    var m = a.getAttribute('href').match(/^([\w-]+\.html)(#.*)?$/);
    if (m) a.setAttribute('href', m[1] + window.location.search + (m[2] || ''));
  });

  // a quiet note on the demo itself: the photos, doctors and fees are still samples
  if (hero) {
    var note = document.createElement('p');
    note.className = 'demo-note load-in';
    note.style.setProperty('--d', '0');
    note.textContent = 'Preview for ' + fullName + ' · sample photos and details';
    hero.insertBefore(note, hero.firstChild);
  }
})();
