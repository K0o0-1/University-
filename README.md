# University Study Materials

A lightweight web-based study hub for university course materials, built with plain HTML, CSS, and JavaScript and published with GitHub Pages.

## Live Website

https://k0o0-1.github.io/University-/

## Overview

This repository organizes multiple university study resources into one simple website. It includes interactive MCQ pages, question-and-answer materials, and subject-specific study content.

The project does not require a backend, database, or installation. It runs directly in the browser.

## Included Materials

- Information Systems Security & Privacy — MCQ
- Information Systems Security & Privacy — Q&A
- Flutter — MCQ
- Enterprise Architecture

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
│   └── pwa-icon.svg
├── data/
│   ├── security-mcq.js
│   ├── security-qa.js
│   ├── flutter-mcq.js
│   └── enterprise-architecture.js
├── materials/
│   ├── mcq-information-security-privacy.html
│   ├── qa-information-security-privacy.html
│   ├── mcq-flutter.html
│   └── enterprise-architecture.html
├── tools/
│   └── validate.py
├── .github/workflows/
│   └── validate.yml
├── .nojekyll
└── README.md
```

## Features

- Central homepage for all study materials
- Interactive multiple-choice question pages
- Question-and-answer study pages
- Reusable JavaScript engines for MCQ and Q&A content
- Responsive design for desktop and mobile
- Static hosting with GitHub Pages
- No backend or database required
- Easy to update by editing the HTML or JavaScript data files

## Technologies Used

- HTML5
- CSS3
- JavaScript
- GitHub
- GitHub Pages

## Running Locally

You can run the project locally without installing any dependencies.

1. Download or clone the repository.
2. Open `index.html` in a web browser.
3. Select the study material you want to open.

Clone command:

```bash
git clone https://github.com/K0o0-1/University-.git
```

Then open:

```text
University-/index.html
```


## Updating Study Content

Study questions and subject data are stored mainly inside the `data/` directory.

For example:

```text
data/flutter-mcq.js
data/security-mcq.js
data/security-qa.js
data/enterprise-architecture.js
```

The shared interface and behavior are handled directly by `assets/mcq-engine.js` and `assets/qa-engine.js`.

## Validation

The repository includes an automatic validator that checks question counts, answer indexes, referenced files, and initial page counters. Run it locally with:

```bash
python3 tools/validate.py
```

GitHub Actions also runs the same validation on pushes and pull requests.

## Repository

https://github.com/K0o0-1/University-

## Author

Khalid Al-Sofi

---

Built as a personal university study workspace for organizing and reviewing course materials in one place.


## Development Quality Rule

**Full-project verification rule:** after every important change, test the changed feature first, then run the complete project validation and browser behavior suite before the change is accepted.

## Quiz & Analytics V2

- Study mode remains the default learning mode.
- Practice mode provides immediate feedback.
- Exam mode hides correctness until the end.
- Custom quizzes support section, question count, current filters, weakness-only scope, and random order.
- Results include answered/unanswered counts, score, time, and average time per question.
- The last 20 quiz sessions are stored locally per browser.
- Per-section statistics, smart mastery levels, and weakness ranking are available.
- Quiz navigation supports answered state and review flags.
- A dedicated statistics view summarizes progress, weaknesses, section performance, and quiz history.
