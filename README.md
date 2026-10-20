# Ivory Lane — premium dental clinic template

A one-page, mobile-first website for dental clinics in India. Plain HTML, CSS and JavaScript: no build step, no frameworks. Open `index.html` to preview, upload the folder to any host to go live.

"Ivory Lane Dental Studio" and everything on the page (doctors, prices, numbers) is **sample content** so the demo looks like a finished site. Replace it with the client's real details before launch.

## Customising for a client

### 1. `js/config.js` (5 minutes)

One file controls everything that repeats across the page:

| Setting | What it changes |
|---|---|
| `name`, `suffix`, `legalName` | Logo, footer, copyright line |
| `theme` | Colour scheme: `lagoon`, `sapphire`, `plum` or `forest` |
| `showThemeSwitcher` | The small colour picker for live demos. **Set to `false` before going live.** |
| `phone`, `phoneRaw`, `whatsapp`, `email` | Every call, WhatsApp and email link |
| `addressLine1/2`, `landmark`, `mapQuery` | Address block, Google Map and "Get directions" |
| `hours` | Hours table and the live "Open now / Closed now" status |
| `social` | Footer icons (leave a link empty to hide its icon); `google` is also the "Read Reviews on Google" button |
| `languages`, `offerTranslation` | Header language menu and the first-visit "view in your language?" question (see below) |
| `formEndpoint` | Leave empty to send bookings to WhatsApp, or paste a Formspree URL to receive them by email |

### 2. `index.html` (content)

Search for `EDIT:` to jump to each block:

- Page title, meta description and the Google business details in `<head>`
- Hero headline and photo
- About text and the four headline numbers (`data-count` is the value that animates)
- Services and starting prices
- The four promises, the first-visit steps, FAQs and payment options
- Doctors: photo, name, degrees, speciality, years and a factual special-interest line
- The hero's factual trust line ("MDS specialists, registered with the Tamil Nadu Dental Council")

### 3. Photos

The demo uses free Unsplash stock photos loaded by URL. For a client, put their photos in `assets/img/` and change each `src`, for example `src="assets/img/hero.jpg"`.

| Slot | Suggested size |
|---|---|
| Hero | 1000 × 1250 (portrait) |
| About, main / small | 900 × 1050 / 600 × 600 |
| Technology | 900 × 620 |
| Smile designing | 1100 × 820 |
| Doctors | 700 × 880 each |

The template has no before/after photo comparison on purpose: the dental code of ethics and the National Dental Commission advise against patient before/after photos in advertising. Use a photo of the clinic, its team or its smile-design software in the Smile designing section instead.

### 4. A custom brand colour

If none of the four themes match the client's logo, edit the five colours in the `:root` block at the top of `css/styles.css`.

### 5. Languages

A website cannot trigger the browser's own "Translate this page?" popup; the browser decides that. The template does the same job itself:

- A globe menu in the header lists English plus the languages in `languages` in `js/config.js`.
- On a first visit, if the visitor's browser lists one of those languages, a bar asks in that language whether to switch. The choice is remembered on that device.
- To preview the question, add `?lang=ta` (or `hi`, `te`, `ml`, `kn`) to the address.

Translation is done by Google Translate, so it is machine quality and needs an internet connection. The clinic name is never translated. For a client who wants polished wording in one language, translate the text in `index.html` by hand instead.

## Before going live

- [ ] `showThemeSwitcher: false` in `js/config.js`
- [ ] `social.google` in `js/config.js` points at the clinic's Google Business profile (the site links to reviews there instead of showing testimonials or ratings)
- [ ] Sample doctors, prices, statistics and the "Since 2011" stamp replaced; doctors' degrees shown exactly as awarded, and "Specialist" / "Orthodontist" used only for dentists with that MDS
- [ ] All stock photos replaced with the client's own
- [ ] Title, meta description, sharing tags (canonical, `og:url`, `og:image`) and JSON-LD block in `<head>` updated
- [ ] `timeZone` in `js/config.js` set if the clinic is outside India
- [ ] `privacy.html` and `terms.html` reviewed by the clinic (they are samples) and their "Last updated" dates set
- [ ] Booking form tested on a phone (it should open WhatsApp with the details filled in)

### Advertising rules for dentists

The copy follows the Dentists (Code of Ethics) Regulations, 2014 (still in force under the National Dental Commission): factual information, qualifications, fees and timings are allowed. Claims of being the "best", "painless" or guaranteed results, and boasting about case numbers, are not. Use only recognised degree and speciality names (for example "MDS (Paediatric and Preventive Dentistry)"). In October 2026 the National Dental Commission warned dentists against patient testimonials and before/after photos in online advertising ([news report](https://medicaldialogues.in/news/health/doctors/national-dental-commission-warns-dentists-against-unethical-social-media-advertising-181335)). Keep the client's wording factual and ask them to confirm anything they are unsure of with the Tamil Nadu Dental Council. This is guidance, not legal advice.

## Files

```
index.html        page structure and content
css/styles.css    design tokens, layout, animation
js/config.js      client details (edit this first)
js/main.js        behaviour (rarely needs editing)
js/legal.js       fills clinic details into the two legal pages
privacy.html      sample privacy policy
terms.html        sample terms of use
assets/img/       put client photos here
```
