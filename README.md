# AgriVision Platform

A full-stack precision agriculture platform featuring real-time satellite analytics, AI-powered insights, and multilingual support (English, Hindi, Bengali).

## Live Deployment

- **Frontend**: https://frontend-taupe-rho-64.vercel.app/
- **Backend API**: https://backend-wheat-rho-11.vercel.app/

## Overview

AgriVision combines satellite imagery, IoT sensor data, and AI to provide farmers with actionable insights:
- Interactive dashboard with React, Vite, Tailwind CSS, Recharts, and Leaflet for satellite analytics
- Real-time field monitoring with vegetation indices (NDVI, EVI, NDRE)
- AI-powered chat assistant (Kisan Mitra) for farming guidance
- Weather forecasting and alerts
- Soil health monitoring with live sensor data
- PDF report generation with satellite imagery and analytics
- Firebase authentication and real-time database integration
- Multi-language support (English, Hindi, Bengali)

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

### Dashboard and Monitoring
- **Interactive Field Map**: Leaflet-based map with satellite imagery overlay, polygon drawing for field selection
- **Vegetation Indices**: Real-time NDVI, EVI, and NDRE calculations with color-coded heatmaps
- **Weather Integration**: Live weather data with forecasts, temperature, humidity, wind speed
- **Field Statistics**: Comprehensive stats cards showing field count, weather, vegetation health, and alerts

### AI-Powered Features
- **Kisan Mitra Chat**: Floating AI assistant (bottom-right) with minimized/close controls, powered by Gemini/Groq
- **AI Insights**: Automated analysis and recommendations based on field data
- **Smart Alerts**: AI-generated descriptions for NDVI, moisture, disease, pest, and stress metrics

### Analytics and Reporting
- **Advanced Charts**: Recharts visualizations for soil moisture vs rainfall, VPD/temperature, health indices
- **Disease and Growth Tracking**: Historical data visualization with trend analysis
- **PDF Reports**: Automated report generation with satellite imagery, KPIs, charts, and recommendations
- **Export Capabilities**: Download reports and analytics data

### Soil Analysis
- **Live Sensor Data**: Real-time readings from Firebase Realtime Database
- **Historical Records**: Record selector with delete functionality
- **Multi-Parameter Monitoring**: NPK levels, pH, moisture, temperature tracking

### Multilingual Support
- **Three Languages**: Full support for English, Hindi, and Bengali
- **Dynamic Translation**: All UI elements, weather descriptions, and system messages translate seamlessly
- **Localized Weather**: Weather conditions and descriptions in user's preferred language

### Field Management
- **Multiple Fields**: Support for managing multiple farm fields
- **Field Drawing**: Interactive polygon drawing tool for precise field boundaries
- **Field Selection**: Easy switching between different fields with saved preferences
- **Field Deletion**: Remove fields with confirmation dialog

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

## Deployment

### Production Deployment (Vercel)

The application is deployed on Vercel with the following configuration:

**Frontend**: https://frontend-taupe-rho-64.vercel.app/
- Deployed as a static SPA with Vite build
- Environment variables configured in Vercel dashboard
- Automatic deployments on push to main branch

**Backend**: https://backend-wheat-rho-11.vercel.app/
- Deployed as serverless functions
- CORS configured for frontend domain
- Firebase Admin SDK for authentication

### Environment Variables Setup

**Frontend (Vercel)**:
- All Firebase configuration variables (VITE_FIREBASE_*)
- VITE_API_BASE_URL pointing to backend deployment
- VITE_GROQ_API_KEY for AI features

**Backend (Vercel)**:
- Firebase Admin SDK credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- FIREBASE_DATABASE_URL for Realtime Database
- GEMINI_API_KEY_2 for AI descriptions
- NODE_ENV=production

### Firebase Configuration

1. **Authentication**: Email/Password and Google Sign-In enabled
2. **Firestore Database**: Security rules configured for user data and fields
3. **Realtime Database**: Rules set for soil sensor data
4. **Authorized Domains**: Production domain added to Firebase Console

### Deployment Steps

1. Commit and push changes to GitHub
2. Backend deployment: `cd backend && vercel --prod`
3. Frontend deployment: `cd frontend && vercel --prod`
4. Verify environment variables in Vercel dashboard
5. Test production deployment

## Testing
- Manual: verify map overlays, alert descriptions per field, analytics charts rendering, AI insight buttons, soil record delete, report PDF generation.
- Add automated tests as needed (none included here).

## License
Proprietary (not specified). Add your license if applicable.

