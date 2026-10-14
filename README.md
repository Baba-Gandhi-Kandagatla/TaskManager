# Orbit

A calm, local-first task, habit, goal, and reflection tracker. It works as an installable web app on Android, macOS, and Windows.

## Project structure

```text
index.html              UI shell and forms
styles.css              responsive design system
app.js                  tracker UI and interactions
src/config.js           deployment configuration
src/cloud.js            Supabase authentication and sync
supabase/schema.sql     secure database schema and policies
docs/CLOUD_SETUP.md     cloud setup instructions
server.js               dependency-free Node development server
```

## Run it

```bash
npm start
```

Then open `http://localhost:8080`. No package installation is required.

## Production build

```bash
npm run build
```

The deployable static website is generated in `dist/`.

## Free deployment — Cloudflare Pages

Connect the GitHub repository to Cloudflare Pages and use:

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Every push to `main` will deploy automatically.

## Install

- Android/desktop Chrome or Edge: open the app and use **Install**.
- Safari on macOS: **File → Add to Dock**.
- Each username has separate password-protected data in the current browser. Use **Settings → Export backup** before clearing browser data or changing devices.

## Free deployment

Without Supabase configuration, profiles and activity are stored in browser `localStorage`. With Supabase configured, data is saved locally first and automatically synced to the user’s cloud account.

Follow [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md) for free cross-device accounts and protected cloud storage.
