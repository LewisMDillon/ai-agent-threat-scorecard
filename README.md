# AI Agent Threat Modelling Scorecard

An interactive scorecard for assessing the security risk of AI agents and agentic workflows. This README reflects the current implementation: compact Bootstrap UI, Bootstrap range sliders with painted left-side fills, modal-based messaging, and Markdown snapshot export.

Live site is [HERE](https://ai-agent-threat-scorecard-ac707295e1e5.herokuapp.com/)

## Features

- Compact, responsive UI built with Bootstrap 5
- Five editable categories (Internet Access, Sensitive Data Access, High-Risk Tool Access, Untrusted Input Processing, Automated Actions) and one calculated weighted score
- Weighted final score normalized to a 0–20 scale; certain combinations trigger prohibition rules (P1–P4)
- Real-time updates: total score, risk tier badge, progress bar, and human-readable risk message
- Markdown snapshot export (download .md) with Project, User, Timestamp, Total Score, Risk Tier, Risk Message, and Category breakdown
- Snapshot metadata persisted to localStorage under `threatAssessmentSnapshot` (but project/user fields are only stored when provided)
- Bottom form Reset is the authoritative reset action

## How to run

1. Open `index.html` in your browser (no build step required). The app includes Bootstrap via CDN.
2. Adjust sliders to reflect the system's characteristics.
3. Watch the Total Score, Risk Tier and Risk Message update live.
4. Use the Reset button at the bottom to clear the form.
5. Click "Save Snapshot (Markdown)" to download a snapshot and persist a small metadata object to localStorage.

Notes: For local development you can serve the folder with a simple static server (for example using Python):

```bash
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

## Snapshot / Persistence details

- Downloaded file: a human-friendly Markdown file named like `threat-snapshot-<project>-<timestamp>.md`. The content uses readable timestamps and friendly category names (no internal IDs).
- localStorage key: `threatAssessmentSnapshot` stores an object with fields:
  - project (string or null)
  - user (string or null)
  - timestamp (ISO string)
  - totalScore (number)
  - tier (string|null)
  - riskMessage (string)
  - scores (object mapping category ids to numeric values)

Design choice: placeholder values such as "Unnamed Project" / "Unknown" are used only in the generated Markdown for readability and are NOT persisted to localStorage. On load, Project/User inputs are intentionally not auto-populated to avoid accidentally filling inputs with placeholder text.

## Scoring and prohibition rules (short)

For detailed descriptions on the scoring justifications please see the doc [HERE](scoring_justification.md)

- Score is computed as a weighted normalized sum and rounded to the nearest whole number on a 0–20 scale.
- Prohibition/Hard-stop rules (P1–P4) examine specific high-risk combinations (sensitive data + external comms + untrusted input, admin tools with untrusted input, etc.). If a prohibition rule applies the score will be set to the maximum (20) and a prohibition code returned.

## Files (important ones)

- `index.html` — Main UI using Bootstrap and the modal for messages.
- `assets/css/styles.css` — Scoped dark theme, spacing tweaks, slider appearance and compact layout rules.
- `assets/js/script.js` — Core application logic (class `ThreatModelScorecard`), renders categories, handles slider input, computes score, paints slider fill, handles snapshot export and localStorage, and shows message modal.

## Development notes

- The app relies on Bootstrap 5 via CDN for styling and the modal. JavaScript initializes on DOMContentLoaded and expects the DOM structure in `index.html`.
- To change category definitions or weights, edit the `this.categories` array near the top of `assets/js/script.js`. Each category includes id, name, maxScore and weightedMaxContribution.
- The score calculation is implemented in `calculateTotalScore()` and returns an object `{ score, prohibitedRule }`.

## Accessibility & UX

- Inputs include aria labels and the UI keeps keyboard-friendly components (native range inputs).
- Modal messages replace blocking alert() calls for a smoother user experience. The modal helper falls back to alert() if Bootstrap's JS is unavailable.

## Troubleshooting

- If the modal does not appear, confirm the Bootstrap bundle is loaded (the HTML uses the official CDN). The app falls back to alert() when necessary.
- If the timestamp or snapshots behave unexpectedly, clear the site's localStorage or delete the `threatAssessmentSnapshot` key from DevTools > Application > Local Storage and refresh.

## License & Attribution

AI Agent Threat Modelling Scorecard © 2026 Code Institute

Security recommendations are informed by the Gen AI Security Project and the OWASP Top 10 for Agentic Applications 2026: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/

Built by Lewis Dillon for Code Institute. Published as a portfolio copy with permission.

