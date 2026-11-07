# DPathfinder AI: Frontend

React 18 + Vite 5 + React Router 6, plain CSS, JavaScript/JSX. No Tailwind, no TypeScript.
The only extra dependency is `three` (the 3D head on the sign-in and sign-up pages). It loads only on those two pages.

This code was written from the approved design prototype. It was **not built or run** where it was created
(that environment had no internet), so follow the checks in step 5 before you trust it.

## 1. Put it in your project

1. Close the dev server if it is running.
2. In your project folder (`C:\Users\dpath\Desktop\dpathfinder AI\`), rename the old `frontend` folder to `frontend-old`.
3. Unzip this package so you end up with `dpathfinder AI\frontend\package.json`.
4. Do not touch the `backend` folder.

## 2. Install and run (PowerShell)

```powershell
cd "C:\Users\dpath\Desktop\dpathfinder AI\frontend"
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Keep the backend running on port 5000 in another terminal.
Your backend `.env` must allow this origin: `ALLOWED_ORIGINS` includes `http://localhost:5173` (this is the default).

## 3. Pages and routes

| Route | Page | Layout |
|---|---|---|
| `/` `/agents` `/docs` | Home, Explore Agents, Documentation | Public site (top nav, footer) |
| `/playground` | Live demo (no sign-up) | Playground (its own layout) |
| `/login` `/register` | Sign In, Create Account | Auth (split panel) |
| `/dashboard` | Overview | Dashboard (sidebar, header) |
| `/dashboard/playground` `/customers` `/orders` `/reports` `/api-keys` `/usage` `/settings` | Dashboard pages | Dashboard |

Dashboard routes need a signed-in user. Anyone else is sent to `/login` and brought back after signing in.

## 4. Where things live

- `src/services/api.js`: the only file that calls the backend. Change the base URL with `VITE_API_BASE_URL`.
- `src/context/`: theme (light, dark, system) and sign-in state. The token is kept in `localStorage` as `dpf_token`.
- `src/components/Chat.jsx`: chat and the Agent Activity panel. The panel shows only the real `toolCalls` the backend returns.
- `src/components/AuthStage.jsx`: the 3D head, rings and particles. `HeroBackdrop.jsx`: the hero images, blinking eyes and neural motion.
- `src/styles/app.css`: the single stylesheet. Colours are variables at the top.
- `src/assets/`: the images. `head.png` is your original head image, unmodified.

## 5. Check it against the real backend (do this once)

The pages were built from the API contract in the project handover. Confirm these against your real routes and validators:

1. Sign up, sign in, sign out, and refresh a dashboard page (it should stay on that page).
2. Playground: send "Hello" (no tool) and "Show pending orders" (a tool). The Agent Activity panel should match.
3. Customers: search, add one, add a duplicate email (you should see the backend message).
4. Orders: move an order forward, then try a move the backend rejects.
5. Reports: the From/To dates are sent as `fromDate` and `toDate` in `YYYY-MM-DD` form. If the backend rejects that format, adjust `Reports.jsx`.
6. API Keys: create a key (shown once), copy it, revoke it.
7. Usage: the table under the totals prints `byEndpoint` as it arrives. Tell me its real shape and I will format it properly.

Conversation memory: the chat sends back the `conversationId` it receives, so the agent keeps context. The id is kept per browser tab.

## 6. Build and deploy

```powershell
npm run build
```

- **Netlify:** Base directory `frontend`, build command `npm run build`, publish directory `dist`. Add the environment variable `VITE_API_BASE_URL` set to your Render backend URL. `public/_redirects` already makes page refreshes work.
- **Render (backend):** set `ALLOWED_ORIGINS` to your Netlify URL.
- Never put `GEMINI_API_KEY`, database credentials or other secrets in the frontend.

## Not included yet

Blog or marketing extras, an account-settings editor (the backend has no endpoint for it), automated tests, and the Explore Agents page has only the one Business Operations Agent.
