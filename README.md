# Lyfe - Personal Dashboard

A premium, high-fidelity responsive personal dashboard built with Next.js (App Router), TypeScript, and Tailwind CSS. Lyfe is designed to feel like a native application and acts as an "Add to Home Screen" Progressive Web App (PWA).

## Features

- **Draggable & Resizable Widgets:** Customize your dashboard layout perfectly on both desktop and mobile using the fluid `react-grid-layout`.
- **Firebase Realtime Sync:** No authentication required. Your layout, pinned stocks, saved streams, and news preferences are synced seamlessly to your specific device using a localized UUID and the Firebase REST API.
- **Micro-animations & Premium UI:** Glassmorphism, smooth hover states, and dark-mode optimizations make Lyfe look incredibly polished.
- **PWA Ready:** Add it to your iOS Home Screen for a full-screen, native-app feel.

## Widgets Included

1. **Stocks Widget:** Real-time stock quotes powered by the Finnhub API.
2. **News Widget:** Curated RSS feeds organized by category (World, Canada, Tech, Finance).
3. **Streams Widget:** Live TV/Video broadcasts powered by HLS.js. Best used with News feeds.
4. **App Launcher:** A beautiful, animated clock/date widget serving as a placeholder for app launching.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Unauthenticated Firebase Realtime Database URL
- Finnhub API Key (get one free at [finnhub.io](https://finnhub.io))

### 2. Environment Variables
Create a `.env.local` file in the root of the project by copying the example:

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
FINNHUB_API_KEY=your_actual_key_here
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-db-id.firebaseio.com
```

### 3. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🛠️ How Persistence Works

Lyfe uses **Zustand** for local state management and syncs data to an open **Firebase Realtime Database** via its REST API.

1. On first load, `src/store/useAppStore.ts` checks `localStorage` for `lyfe_client_id`. If it doesn't exist, it generates a new UUID.
2. Data is written to `https://<YOUR-DB>.firebaseio.com/users/<CLIENT_ID>.json`.
3. Because the user ID is generated locally and stored in `localStorage`, each device will maintain its own individual dashboard layout and preferences. No login screen necessary!

*(Note: The Firebase DB rules must be set to `.read": true, ".write": true` for this approach to work).*

---

## ➕ How to add more Feeds / Tickers / Channels

### RSS Feeds
Modify `FEEDS` object in `src/app/api/news/route.ts` to add or remove RSS feeds corresponding to categories.

### Stocks & Streaming
Currently, you can manually adjust defaults in `src/store/useAppStore.ts`. In a future update, you can add simple input fields within the dedicated `/stocks` or `/streams` routes to dispatch `updateConfig({ stocks: [...] })` dynamically to the store.

---

## ☁️ Deployment

Lyfe can be deployed perfectly on [Vercel](https://vercel.com/) for free.

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add `FINNHUB_API_KEY` and `NEXT_PUBLIC_FIREBASE_DATABASE_URL` to the Environment Variables settings in the Vercel dashboard.
4. Deploy!
