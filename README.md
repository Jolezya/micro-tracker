# Micro Tracker

A premium fitness & nutrition tracker — navy & gold brand aesthetic, built as an installable web app.

Clients open the URL on their phone, tap **Share → Add to Home Screen**, and the tracker lives as an app icon. Works offline. No app store needed.

---

## Quick deploy

1. **GitHub:** create a repo called `micro-tracker`, upload the contents of this folder
2. **Vercel:** sign up at vercel.com, import the GitHub repo, click Deploy
3. Your app is live at `micro-tracker.vercel.app`

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project structure

- `src/App.jsx` — all UI and logic
- `src/foods.js` — built-in food database
- `public/` — app icons (navy/gold MT monogram)
- `index.html` — HTML shell with iOS standalone meta tags
- `vite.config.js` — PWA + build config

Edit `src/App.jsx` to change branding. Colors are in the `C` object at the top.
Push new entries into the `FOODS` array in `src/foods.js` to expand the database.

---

## Data storage

All client data lives in the phone's localStorage — persists on device, does not sync across devices.

---

Crafted by Peter.
