# SAFARNAMA AI – Budget Vacation Optimizer
> **"Your budget. Your journey. Your world."**

**SAFARNAMA AI** is a full-stack, budget-conscious travel planner and vacation optimizer. Built for domestic and worldwide destinations, it combines geographic intelligence, authentic accommodations, interactive maps, air travel options, verified emergency contacts, and AI-powered travel strategy generation.

---

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS, Leaflet Maps, Lucide Icons, jsPDF.
- **Backend:** Node.js 22+, Express, Native ESM, Server-side proxying.
- **AI Intelligence:** `@google/genai` SDK using `gemini-3.8-flash` with circuit breaker and deterministic fallback.
- **Open Data:** OpenStreetMap Nominatim geocoding, Overpass API, and authentic curated landmark & emergency directories.
- **Storage:** Client-side `localStorage` with error-isolated schema; zero database dependency.

---

## Key Features

1. **Worldwide Destination Coverage:** Domestic Indian destinations and international cities across Europe, Southeast Asia, the Middle East, the Americas, and Oceania.
2. **Deterministic Multi-Tier Budget Optimizer:** Computes 3 mathematically balanced plans (Lowest Cost, Balanced Experience, Comfort-Oriented) with itemized categories (transit, stays, meals, activities, and emergency buffers).
3. **Interactive Maps & Real Directions:** Accurate coordinates for landmarks and lodgings with direct Google Maps turn-by-turn routing links.
4. **Authentic Lodging & Review Intelligence:** Explicit provider rating scales (5.0 vs 10.0), verified category breakdown scores, and AI review synthesis.
5. **Travel Safety & Emergency Assistant:** Verified emergency numbers (Police, Ambulance, Fire, Tourist Helplines, and Embassies), official travel advisories, and an interactive pre-departure checklist.
6. **Air Travel & Flight Search:** Origin/destination route search opening directly to Google Flights and Skyscanner.
7. **Offline PDF Export:** Comprehensive multi-page travel dossier containing the itinerary, cost breakdown, and verified emergency contacts.

---

## Quickstart (Local Development)

### Prerequisites
- Node.js `v20.0.0` or `v22.0.0+`
- npm `v10.0.0+`

### 1. Clone & Install
```bash
git clone <repository-url>
cd safarnama-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and configure your Gemini API Key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
NODE_ENV=development
```
*(Note: If `GEMINI_API_KEY` is omitted, SAFARNAMA AI automatically activates its deterministic planning mode—all maps, budget math, accommodations, and safety features remain 100% operational).*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build & Testing

### Type-Check
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Compiled assets are generated in `./dist`.

### Run Production Server Locally
```bash
npm start
```
Starts the Node.js production server hosting the built frontend and API proxy at `http://localhost:3000`.

---

## Independent Deployment Instructions

SAFARNAMA AI is engineered to run completely independently without requiring Google AI Studio to remain open or running.

### Option A: Deploy to Vercel (Recommended)
This repository includes a pre-configured `vercel.json` and `api/index.ts` serverless handler:
1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key.
5. Click **"Deploy"**.
6. Vercel automatically builds `./dist` and routes `/api/*` to the serverless Express backend.

### Option B: Deploy to Google Cloud Run / Docker
1. Build the production application:
   ```bash
   npm run build
   ```
2. Start command is:
   ```bash
   node server.ts
   ```
3. Ensure the environment variables `PORT=8080` (or injected by Cloud Run) and `GEMINI_API_KEY` are provided in the Cloud Run service settings.

### Option C: Deploy to Render / Railway / VPS
- **Build Command:** `npm run build`
- **Start Command:** `node server.ts`
- **Node Version:** `22.x`
- **Port:** Set to `process.env.PORT` automatically.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI itinerary & review synthesis. If omitted, deterministic rule-based planning runs automatically. |
| `PORT` | Optional | Port for the HTTP server (default: `3000` in dev, `8080` on Cloud Run). |
| `NODE_ENV` | Optional | Set to `production` in production hosting environments. |
| `APP_URL` | Optional | Base URL of the deployed application. |

---

## Reliability & Anti-Hallucination Guarantees

- **Arithmetic:** All budget totals, per-person rates, and currency sums are computed deterministically in code—never by LLM arithmetic.
- **Coordinates:** Grounded in OpenStreetMap Nominatim and authentic verified catalogues. No randomized or fabricated latitude/longitude pairs.
- **Hotel Tariffs & Availability:** Clearly marked as planning estimates unless confirmed via external links (Google Travel / Booking.com).
- **Emergency Dispatch:** Cites official government emergency dispatch lines and displays clear life-safety guidance.

---

## License
MIT License. Created for the SAFARNAMA AI Budget Vacation Optimizer initiative.
