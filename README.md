# University — Phase 9 DeepSeek Style-Matching Preview (NOT APPROVED)

This is a candidate based on the complete University Phase 9 editorial version. **No deployment** was performed.

Open `University_Phase9_DeepSeekMatched_Interactive_Preview.html` for a standalone offline demo.
Read `PHASE_9_DEEPSEEK_PRINT_MATCH_REPORT.md` for method, differences, and verification.
See `University_Phase9_DeepSeekMatched_Flutter_12_Chapters_A4.pdf` for the 12-chapter print.
The originally uploaded DeepSeek HTML and direct print can be found in `references/`.
Other subjects, Flutter 341-question bank, study state, progress and quiz engine are preserved.

Phase 9 requires the user's design acceptance; this candidate does not replace the v1.8 baseline automatically.

# University Study Library

> **Phase 8 technical audit — v1.8.0 (2026-10-10):** local checks completed without modifying app code; **release is not fully production-verified**. See `PHASE_8_FINAL_AUDIT_REPORT.md` and `phase8-evidence/test-matrix.json`. User has reserved all comprehensive visual/typography/chapter-formatting/printing changes for **Phase 9** (`PHASE_9_UI_UX_PRINT_BACKLOG.md`). **Not deployed.**

> **Current local review snapshot: v1.7.1 (unpublished)** — PWA/Offline/Accessibility/Voice improvements were tested locally and require real-device/offline installation acceptance before deployment. Previous live GitHub Pages deployment is NOT v1.7.1.

A static, offline-capable study library built with HTML, CSS and JavaScript and published with GitHub Pages.

## Live Website

https://k0o0-1.github.io/University-/

> **User approved Phase 7.** Pre-Phase8 Flutter heading/formatting and exact source question ordering changes are awaiting visual review; Phase 8 has not started.

## Included Materials

- Enterprise Architecture — 275 MCQ
- Flutter — 341 MCQ
- Flutter Interactive Study — 12 chapters / 341 linked MCQ (4 internal source modules)
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
- A4/PDF printing with chapter-first print modes, repeated headings, plain text-answer highlighting and linked chapter indexes (Phase 6 locally implemented; browser parity pending)
- Learning full-document print: شرح + أسئلة + حلول or without solutions, chapter/module/review subsets
- MCQ answer keys
- Keyboard-accessible question interactions
- PWA manifest with 192/512 PNG icons, shared install prompt (supported browsers), registration from all pages and registry-derived first-session precache (Phase 7 mock SW acceptance complete; real HTTP installation remains unverified)
- Keyboard skip link, focus-visible indicators, reduced-motion support, flashcard keyboard activation
- Flutter chapter audio with Arabic voice selection, chunked reading, pause/resume and stop (real speaker/device playback remains unverified)
- Local-only progress storage using LocalStorage
- Backup / restore support
- Responsive mobile layout
- Registry-driven library: show/hide materials without editing the home-page markup; generic learning entries share one template; legacy bank pages still need their own HTML adapters
- Flexible Learning Material schema: optional Modules / Chapters / content blocks / MCQ (Flutter UI currently 12 direct Chapter cards → Content)

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
│   ├── registry-core.js
│   ├── learning-model.js
│   ├── learning-state.js
│   ├── learning-print.js
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

## Print configuration (Phase 6)

On the Flutter Learning page, **المزيد → الطباعة**, then choose complete study with/without answers, chapter/module scope or flagged/weak Review. Other MCQ/Q&A materials support their own print settings (questions / answers / answer key when available).

The default print attribution remains the existing one. To customize it, define `window.UniversityPrintConfig` before launching print:

```js
window.UniversityPrintConfig = {author: 'Your Name', authorUrl: 'https://example.com'};
```

The printed attribution is a margin label; supported Chromium displays repeated section/chapter names and page numbers in print margin boxes. Other browsers and actual printers require separate validation.

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

## Security & data integrity — Phase 1 (local preview)

Backup JSON is treated as untrusted input. The Flutter learning engine and legacy MCQ/Q&A engines now verify restored state types and identity before applying it. Invalid, mismatched or oversized backups are rejected. Preserve older JSON backups; unsupported manually edited formats may be refused. See `PHASE_1_SECURITY_REPORT.md` and `tests/backup-security.spec.js` for scope, evidence and limitations. This change is not yet part of the public GitHub Pages site.

## Phase 2 architecture reference

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for layer boundaries, optional schemas, safe adding/removing materials, compatibility limitations and test commands.

### Phase 3: Flutter Chapter-first Study (local candidate, 2026-10-09)

The learning experience now enters the 12 Flutter Chapters directly without visible Modules. Resume bookmarks include the last question index and persist through navigation/reload. A Chapter with MCQs cannot be marked completed before all its linked questions have been attempted. Progress measures **distinct question coverage**, while displayed accuracy measures **correct answer attempts among attempts**, not mastery of unseen material.

For isolated Chromium acceptance, run `python3 tests/phase3-study-offline.py`. See `PHASE_3_STUDY_REPORT.md` for test results and outstanding Phase 4–8 work. No public deployment occurred.

## Phase 4 Visual Preview (local only — 2026-10-09)

Flutter Learning now has a screen-specific calm design (`assets/learning-design-v4.css`), simplified 12-Chapter grid, and a document-like chapter reader with explanation/question section shortcuts. Modules remain optional in the generic data engine but are not shown in Flutter navigation. No changes to the academic bank or backup schema. See `PHASE_4_VISUAL_REPORT.md` for supported tests and limitations. The live GitHub Pages deployment has **not** been updated with this preview.


## Phase 5 — local candidate, not published (2026-10-09)

Quiz/Review/Analytics reliability improves persisted flags and quiz history, backup import, timed-session resumption and denominator-aware results. See `PHASE_5_REPORT.md` and the offline test in `tests/phase5-correctness-offline.py`. This source ZIP is **not deployed**. Phases 6–8 remain pending.


## Phase 9.1 — Flutter Interactive Study review (not a release)

- Visible Chapter topic-index panel removed; the teaching sections remain.
- Removed "مثال من المصدر" / "أوامر ومراجع" headings above inline code examples.
- Removed Module from the print scope and human-facing linked index; original linked index layout restored.
- Underlying mapping IDs stay unchanged to protect previous question history and storage.
- This is a review branch, not the live `main` build.