# University Study Library

A static, offline-capable study library built with HTML, CSS and JavaScript and published with GitHub Pages.

## Live Website

https://k0o0-1.github.io/University-/

## Included Materials

- Enterprise Architecture — 275 MCQ
- Flutter — 341 MCQ
- Flutter Interactive Study — 4 modules / 12 chapters / 61 topics / 341 linked MCQ
- Information Systems Security & Privacy — 200 MCQ
- Information Systems Security & Privacy — 100 Q&A

## Main Features

- Study, Quiz, Cards and Analytics navigation
- Practice and Exam quiz modes
- Section, count, source, order and timer controls
- Per-question review flags
- Smart mastery and weakness analytics
- Quiz history and resume support
- Search, section filtering and error sorting
- Professional A4/PDF printing
- Linked vertical print indexes
- MCQ answer keys
- Keyboard-accessible question interactions
- PWA installation and full-library offline precache
- Local-only progress storage using LocalStorage
- Backup / restore support
- Responsive mobile layout
- Registry-driven materials: add/remove MCQ, Q&A or Learning materials without changing the hub markup
- Flexible Learning Material schema: Modules → Chapters → Topics → Content Blocks

## Project Structure

```text
University-/
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── styles.css
│   ├── mcq-engine.js
│   ├── qa-engine.js
│   ├── study-v2.js
│   ├── study-plus.js
│   ├── navigation-phase1.js
│   ├── study-ui-loader.js
│   ├── study-phase2.js
│   ├── question-card-phase3.js
│   ├── quiz-phase4.js
│   ├── analytics-phase5.js
│   ├── print-phase6.js
│   ├── ui-hotfixes.js
│   ├── project-fixes.js
│   ├── materials-hub.js
│   ├── learning-loader.js
│   ├── learning-engine.js
│   ├── learning-styles.css
│   └── pwa-icon.svg
├── data/
│   ├── enterprise-architecture.js
│   ├── flutter-mcq.js
│   ├── security-mcq.js
│   └── security-qa.js
├── materials/
│   ├── enterprise-architecture.html
│   ├── mcq-flutter.html
│   ├── mcq-information-security-privacy.html
│   ├── qa-information-security-privacy.html
│   └── learning.html
├── tests/
│   ├── ui.spec.js
│   ├── regression.spec.js
│   ├── phase1.spec.js ... phase8.spec.js
│   ├── hotfix-review-menu.spec.js
│   ├── project-fixes.spec.js
│   ├── print-all-materials.spec.js
│   ├── pwa-complete.spec.js
│   └── cross-browser-smoke.spec.js
├── tools/
│   └── validate.py
└── .github/workflows/
    └── validate.yml
```

## Running Locally

Use a local web server so PWA and Service Worker behavior works correctly:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

Opening `index.html` directly from `file://` is sufficient for basic study pages, but not for Service Worker / offline testing.

## Study Data

Question-bank content is stored in `data/`. The shared engines render the material pages and store user progress locally in the browser.

Do not edit question-bank content as part of a UI or infrastructure change unless the content change is explicitly reviewed.

## Validation

Run the static validator:

```bash
python3 tools/validate.py
```

It checks:

- declared and actual question counts
- MCQ answer indexes
- required Q&A answers
- section badge ranges when numeric ranges are used
- referenced local files
- initial page counters
- required UI modules
- PWA offline precache coverage
- WhatsApp author links

## Browser Tests

GitHub Actions runs:

- complete Chromium Playwright suite
- A4/PDF generation checks for all four materials
- first-session offline-library checks
- Firefox smoke tests
- WebKit smoke tests
- JavaScript syntax validation

## Development Quality Rule

After every important change:

1. Test the changed behavior directly.
2. Run the static validator and JavaScript syntax checks.
3. Run the complete Chromium Playwright suite.
4. Run cross-browser smoke tests for sensitive UI behavior.
5. Do not merge to `main` until all required checks pass.

## Author

**Eng. Khalid Al-sofi**  
WhatsApp: +967 771 179 020


## Flexible Material Architecture

The home page is generated from `data/materials-registry.js`. A material can be added or removed through the registry without hard-coding a new card in `index.html`.

Supported material families now include legacy `mcq`, `qa`, and the generic `learning` surface. Learning materials may use optional Modules and Chapters and are composed of Topics and Content Blocks. The Flutter Interactive Study material is the first implementation of this schema.

Question-bank content remains independent from learning content so the same approved bank can be linked to explanations without duplicating or rewriting the questions.
