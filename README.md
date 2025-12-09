# AgriVision Platform

A full-stack precision agriculture app featuring:
- Interactive dashboard (React + Vite + Tailwind, Recharts, Leaflet) for satellite analytics, field alerts, soil readings, live chat (Kisan Mitra), and reports.
- Backend services (Node/Express) for AI-driven descriptions, PDF report generation, and Sentinel-2 heatmaps.
- Firebase for auth, Firestore for data, Realtime Database for live soil sensor readings.

## Contents
- `frontend/` — React/Vite app (dashboard, analytics, alerts, soil analysis, chat).
- `backend/` — Express controllers/services (reports, AI descriptions, NDVI/analytics ingestion).

## Prerequisites
- Node.js 18+
- npm or yarn
- Git

## Environment Variables

### Frontend (`frontend/.env`)
Create `frontend/.env` (never commit secrets):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

VITE_GROQ_API_KEY=...           # For AI insights in Analytics
```

### Backend (`backend/.env`)
Create `backend/.env` (never commit):
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

GEMINI_API_KEY_2=...            # For description service (Gemini)
GROK_API=...                    # If using Grok/x.ai

SENTINEL_CLIENT_ID=...
SENTINEL_CLIENT_SECRET=...
AI_BASE_URL=https://itvi-1234-indexesall.hf.space
```

> Rotate any leaked keys. Ensure `.env` is in `.gitignore`.

## Install & Run

### Frontend
```
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5173 by default.

### Backend
```
cd backend
npm install
npm run dev      # or npm start
```
Backend typically on http://localhost:5000 (check your scripts/config).

## Key Features
- **Dashboard & Kisan Mitra Chat**: Floating chat widget (bottom-right) with minimized/close controls, green theme.
- **Field Map**: Leaflet map without attribution; polygon clipping for heatmap overlay; hover tooltips inside polygon only.
- **Alerts**: Per-field alert cards with NDVI/moisture/disease/pest/stress metrics, change badges, AI descriptions keyed per field+alert.
- **Analytics**: Recharts visualizations (soil moisture vs rain, VPD/temp, health indices, disease/growth) plus Groq-powered AI insights. Full-page loading screen while fetching.
- **Soil Analysis**: Reads latest sensor data from Firebase Realtime DB (`soil`), record selector, delete record, aligned value/unit, hover effects, expanded spacing.
- **Reports**: PDF generation combining heatmaps (Sentinel-2), KPIs, charts, recommendations. Fixed string/template issues, proper headers, and auth bearer handling.

## Notable Files
- Frontend
  - `src/pages/Analytics.jsx`: Analytics charts, Groq AI insights (uses `VITE_GROQ_API_KEY`), loading screen, field selector.
  - `src/pages/Alerts.jsx`: Alert cards, change badges, AI metric descriptions per field/alert.
  - `src/pages/SoilAnalysis.jsx`: Realtime DB soil data, record selector, delete, UI polish.
  - `src/components/dashboard/FieldMap.jsx`: Map, polygon clip, hover limited to polygon.
  - `src/components/dashboard/KisanMitraChat.jsx`: Floating chat widget (Gemini/Groq configurable via backend service).
- Backend
  - `src/controllers/report.controller.js`: PDF report generation, Sentinel-2 fetch, AI heatmaps, chart drawing.
  - `src/controllers/ai.controller.js`: AI endpoints (descriptions/advisories).
  - `src/services/description.js`: Gemini/Grok description service (English-only, short farmer-friendly outputs).

## API Keys & Security
- Do **not** hardcode keys in code. Use env vars only.
- If a key was ever committed, rotate it and purge from git history (`git filter-repo` with replace-text), then force-push.
- Keep `.env` files out of version control.

## Common Issues
- **401 Invalid API Key (Groq/Gemini/Grok)**: Ensure `VITE_GROQ_API_KEY` (frontend) or backend keys are set; restart dev servers.
- **process is not defined (Vite)**: Use `import.meta.env.VITE_*` in the frontend.
- **Hover outside polygon on map**: Fixed in `FieldMap.jsx` with point-in-polygon guard.
- **Push blocked for secrets (GH013)**: Rotate the leaked key, rewrite history to remove it, then force-push.

## Scripts (typical)
Frontend:
```
npm run dev      # start Vite
npm run build    # production build
npm run preview  # preview build
```
Backend:
```
npm run dev      # nodemon/ts-node style
npm start        # production start
```

## Deployment Notes
- Provide env vars to both frontend (build-time) and backend (runtime).
- For Vite, env vars must be prefixed with `VITE_`.
- Ensure CORS settings on backend if frontend and backend are on different origins.

## Testing
- Manual: verify map overlays, alert descriptions per field, analytics charts rendering, AI insight buttons, soil record delete, report PDF generation.
- Add automated tests as needed (none included here).

## License
Proprietary (not specified). Add your license if applicable.

