# ⚠️ IMPORTANT NOTES FOR VERCEL DEPLOYMENT

## Files with Hardcoded localhost URLs

The following files have hardcoded `http://localhost:5000` URLs that should be updated to use environment variables or the deployed backend URL:

1. `/home/sumit/AgriVision/AgriVision/frontend/src/pages/Reports.jsx` (line 71)
2. `/home/sumit/AgriVision/AgriVision/frontend/src/pages/LiveCheck.jsx` (line 52)
3. `/home/sumit/AgriVision/AgriVision/frontend/src/pages/PestScanner.jsx` (line 51)
4. `/home/sumit/AgriVision/AgriVision/frontend/src/pages/Alerts.jsx` (line 382)
5. `/home/sumit/AgriVision/AgriVision/frontend/src/components/dashboard/KisanMitraChat.jsx` (line 29)
6. `/home/sumit/AgriVision/AgriVision/frontend/src/components/dashboard/AIAssistant.jsx` (line 30)
7. `/home/sumit/AgriVision/AgriVision/frontend/src/components/dashboard/VegetationIndexCard.jsx` (line 277)

## Recommended Fix

### Option 1: Use Environment Variable (Recommended)
Create a constant in `endpoints.js`:
```javascript
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
```

Then import and use it in all files:
```javascript
import { API_BASE } from '../api/endpoints';
// Use: `${API_BASE}/api/disease/predict`
```

### Option 2: Direct Replacement
After deploying backend, do a find-and-replace:
```bash
find frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's|http://localhost:5000|https://your-backend-url.vercel.app|g' {} +
```

## Environment Variables for Vercel

### Frontend (.env in Vercel dashboard)
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
```

### Backend (.env in Vercel dashboard)
Add all variables from your local `.env` file including:
- Firebase credentials
- API keys
- Any other secrets

## Deployment Order

1. Deploy backend first
2. Get backend URL
3. Update frontend environment variable
4. Deploy frontend
