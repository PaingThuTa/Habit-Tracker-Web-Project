# Habit Tracker

Habit tracking app with Microsoft login (MSAL), MongoDB persistence, Tailwind CSS UI, and client state via Zustand. The app exposes a full REST-style backend using Next.js App Router API routes under `src/app/api/(backend)`.

The site is configured to run under a base path: `/habit-tracker` (see `next.config.mjs`). If you deploy at a different subpath or root, update configuration accordingly.

## Stack

- **Framework**: `next@14` (App Router, React 18)
- **UI**: Tailwind CSS (`tailwind.config.js`, `src/app/globals.css`)
- **State**: Zustand (`src/store/*`)
- **Auth**: Microsoft identity via `@azure/msal-browser` (`src/store/useAuthStore.js`)
- **Database**: MongoDB via official driver (`src/lib/mongodb.js`)
- **Dates**: `date-fns`

## Features

- **Microsoft login** with popup using MSAL; backend verifies tokens via Microsoft Graph.
- **Habits CRUD** and **completions** with period logic (daily/weekly/monthly) and metrics.
- **Categories** management with duplicate-protection and cascading updates.
- **Dashboards and detail pages** built with the App Router groups under `src/app/(frontend)`.
- **Secure API** routes enforce Bearer tokens and user scoping in MongoDB.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```
2. **Configure environment**
   Create `.env` at project root and set at minimum:

   ```bash
   # Required (used server-side by API routes)
   MONGODB_URI="your-mongodb-connection-string"

   # Optional (client): override API base URL; defaults to "/api"
   NEXT_PUBLIC_API_URL="https://your.domain/habit-tracker/api"

   # Optional (client): used to compose API base when not setting NEXT_PUBLIC_API_URL
   NEXT_PUBLIC_BASE_PATH="/habit-tracker"
   ```

   Notes:

   - `next.config.mjs` sets `basePath: '/habit-tracker'`. If you change it, also update redirect handling in `src/store/useAuthStore.js` and optionally `NEXT_PUBLIC_BASE_PATH`.
   - `src/store/useAuthStore.js` contains MSAL `clientId` and `authority`. Replace them with your Microsoft Entra ID app registration and tenant if deploying your own instance.
3. **Run the app**

   ```bash
   npm run dev
   # build & start (production)
   npm run build && npm start
   ```

## Scripts

- `dev`: Start Next.js in development
- `build`: Production build
- `start`: Start production server
- `lint`: Lint with Next.js config

## Project Structure

```text
src/
  app/
    (frontend)/
      (authentication)/login/page.jsx
      (habit-management)/dashboard/page.jsx
      (habit-management)/habits/page.jsx
      (habit-management)/habit/[id]/page.jsx
      (habit-management)/categories/page.jsx
    api/(backend)/
      auth/microsoft/route.js
      auth/me/route.js
      habits/route.js
      habits/[id]/route.js
      completions/route.js
      completions/[id]/route.js
      categories/route.js
      categories/[id]/route.js
      health/route.js
    layout.jsx
    page.jsx
    globals.css
  adapters/persistence.js   
  lib/mongodb.js  
  lib/auth.js   
  store/useAuthStore.js   
  store/useHabitsStore.js   
  utils/time.js                 
  utils/metrics.js           
```

## API Design

All endpoints live under the base path (default `/habit-tracker`) and require `Authorization: Bearer <MicrosoftAccessToken>` unless stated otherwise.

- **Auth**

  - `POST /api/auth/microsoft` — Body: `{ accessToken }` (no Authorization header). Verifies via Microsoft Graph and upserts a user. Returns `{ user }`.
  - `GET /api/auth/me` — Returns the authenticated `{ user }`.
- **Habits**

  - `GET /api/habits` — List habits for the user.
  - `POST /api/habits` — Create habit. Server assigns `id`, `userId`, timestamps.
  - `PUT /api/habits/:id` — Update habit fields (server protects `id`, `userId`, `createdAt`).
  - `DELETE /api/habits/:id` — Delete habit and its completions.
- **Completions**

  - `GET /api/completions?habitId=...` — List completions (all user habits or for a single habit).
  - `POST /api/completions` — Body: `{ habitId, timestamp? }` — Create a completion.
  - `PUT|PATCH /api/completions/:id` — Update `timestamp` and/or `habitId` with validation.
  - `DELETE /api/completions/:id` — Delete a completion.
- **Categories**

  - `GET /api/categories` — List categories.
  - `POST /api/categories` — Body: `{ name }` — Create category (case-insensitive duplicate check).
  - `PUT|PATCH /api/categories/:id` — Update name with duplicate protection and cascade to habits.
  - `DELETE /api/categories/:id` — Delete category and unset it from affected habits.
- **Health**

  - `GET /api/health` — Simple database connectivity status.
