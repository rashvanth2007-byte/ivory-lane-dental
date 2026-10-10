/* ════════════════════════════════════════════════════════════════════════
   CLIENT CONFIG — edit this file first for every new client.
   Everything here is filled into the page automatically (name, phone,
   WhatsApp, address, hours, map, colours). Longer content such as
   services, doctors, reviews and FAQs lives in index.html and is marked
   with "EDIT:" comments.
   ════════════════════════════════════════════════════════════════════════ */
window.SITE = {
  /* ── Brand ── */
  name: "Ivory Lane",                 // short name shown in the logo
  suffix: "Dental Studio",            // small text under / after the name
  legalName: "Ivory Lane Dental Studio",
  city: "Chennai",
  area: "Anna Nagar",

  /* ── Colour theme: "lagoon" | "sapphire" | "plum" | "forest" ──
     To use a custom brand colour instead, edit the :root block at the
     top of css/styles.css. */
  theme: "lagoon",

  /* Shows a small colour picker so you can preview themes live while
     pitching to a client. Set to false before the site goes live. */
  showThemeSwitcher: true,

  /* ── Contact ── */
  phone: "+91 98765 43210",           // shown on the page
  phoneRaw: "+919876543210",          // used for tap-to-call
  whatsapp: "919876543210",           // country code + number, digits only
  whatsappGreeting: "Hi! I'd like to book an appointment.",
  email: "hello@ivorylane.dental",

  /* ── Location ── */
  addressLine1: "No. 24, 2nd Avenue, Anna Nagar",
  addressLine2: "Chennai, Tamil Nadu 600040",
  landmark: "Opposite Tower Park, above Cafe Mocha",
  mapQuery: "Anna Nagar Tower Park, Chennai", // what Google Maps should search for

  /* ── Opening hours (24-hour clock, clinic's local time) ──
     Use closed: true for a day off. Index 0 = Sunday. */
  hours: [
    { day: "Sunday",    open: "10:00", close: "13:00" },
    { day: "Monday",    open: "09:30", close: "20:00" },
    { day: "Tuesday",   open: "09:30", close: "20:00" },
    { day: "Wednesday", open: "09:30", close: "20:00" },
    { day: "Thursday",  open: "09:30", close: "20:00" },
    { day: "Friday",    open: "09:30", close: "20:00" },
    { day: "Saturday",  open: "09:30", close: "20:00" }
  ],

  /* "Next available" card in the hero: the earliest slot offered is this many
     minutes from now, rounded up to the next slot, within the hours above. */
  slotLeadMinutes: 60,
  slotLengthMinutes: 30,

  /* ── Social links (leave "" to hide an icon) ── */
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "",
    google: "https://www.google.com/maps"   // link to the Google Business profile
  },

  /* ── Languages ──
     Adds a language menu to the header (machine translation by Google
     Translate). On a visitor's first visit, if their browser is set to one
     of these languages, the site asks whether they'd like to switch.
     Add or remove lines to suit the client's city. Use [] to turn it off.
     Only languages with a "prompt" line can show the first-visit question;
     others still appear in the menu. */
  languages: [
    { code: "ta", label: "தமிழ்",   prompt: "இந்த இணையதளத்தை தமிழில் பார்க்க விரும்புகிறீர்களா?" },
    { code: "hi", label: "हिन्दी",   prompt: "क्या आप यह वेबसाइट हिन्दी में देखना चाहेंगे?" },
    { code: "te", label: "తెలుగు",  prompt: "ఈ వెబ్‌సైట్‌ను తెలుగులో చూడాలనుకుంటున్నారా?" },
    { code: "ml", label: "മലയാളം", prompt: "ഈ വെബ്സൈറ്റ് മലയാളത്തിൽ കാണണോ?" },
    { code: "kn", label: "ಕನ್ನಡ",   prompt: "ಈ ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ಕನ್ನಡದಲ್ಲಿ ನೋಡಲು ಬಯಸುವಿರಾ?" }
  ],
  offerTranslation: true,   // show the first-visit question

  /* ── Booking form ──
     By default the form opens WhatsApp with the patient's details
     pre-filled, so it works with no backend at all.
     To receive requests by email instead, paste a Formspree (or similar)
     endpoint here, e.g. "https://formspree.io/f/abcdwxyz". */
  formEndpoint: ""
};
