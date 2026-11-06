# DPathfinder AI - Backend

Express + MongoDB (Mongoose) + Google Gemini (`@google/genai`) with function/tool calling.
Plain ES modules. Every file starts with a comment explaining its job.

## 1. Prerequisites
- Node.js 20 or newer (`node -v`)
- A MongoDB database (MongoDB Atlas free tier works)
- A Gemini API key from https://aistudio.google.com

## 2. Setup
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` (same folder) and fill in the values:

| Variable | Required | Meaning |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string, with a database name, e.g. `.../dpathfinder` |
| `GEMINI_API_KEY` | yes | Your Gemini key (server only, never in browser code) |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash`. Change here, not in code |
| `JWT_SECRET` | yes | Random string, 32+ characters |
| `API_KEY_SECRET` | yes | A different random string, 32+ characters |
| `ALLOWED_ORIGINS` | no | Frontend URLs allowed by CORS, comma separated. Default `http://localhost:5173` |
| `PORT` | no | Default 5000 |
| `NODE_ENV` | no | `development` or `production` |
| `JWT_EXPIRES_IN` | no | Default `1d` |
| `BCRYPT_ROUNDS` | no | Default 12 |
| `GEMINI_TIMEOUT_MS` | no | Default 30000 |
| `DEMO_RESET_COOLDOWN_SECONDS` | no | Default 30 |
| `AUTH_RATE_LIMIT` / `DEMO_CHAT_RATE_LIMIT` / `DEMO_RESET_RATE_LIMIT` / `API_RATE_LIMIT` | no | Requests per window per IP (defaults 10 / 10 / 3 / 300) |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

If a required variable is missing or still says `replace_me`, the server stops at startup and tells you which one.

## 3. Database
MongoDB creates the database and collections automatically on first use. The name comes from the end of `MONGODB_URI`.
Atlas checklist: database user created, your IP (or `0.0.0.0/0` for development) allowed under Network Access.

Seed the isolated demo data (optional - the demo also seeds itself on first use):
```bash
npm run seed
```
Sample data: 6 customers, 10 orders. Pending 2 (117,500), processing 2 (148,000), shipped 2 (85,000), delivered 3 (320,000), cancelled 1 (38,000). Revenue = 320,000, pipeline = 350,500.

## 4. Run
```bash
npm run dev     # restarts on file save (nodemon)
npm start       # production style
```
Check: open http://localhost:5000/health - you should see `"database": "connected"`.

## 5. Tests
```bash
npm test
```
- Uses a temporary in-memory MongoDB (downloaded automatically on the first run, so it needs internet and may take a few minutes). Alternatively set `TEST_MONGODB_URI` to a database whose name contains `test`.
- Gemini is faked in tests: no real API calls, no cost. Tests can never touch your real database (`tests/setup.js` overrides the connection settings).
- Covers: health/safe errors, startup config checks, auth, customers, orders, reports, agent tool-calling round trip, demo isolation, API keys (once-only display, revoked, expired, scopes), workspace isolation, rate limits.

## 6. API reference
All responses: success `{ "success": true, "data": ... }`, error `{ "success": false, "error": { "code", "message", "details?" } }`.
Base URL locally: `http://localhost:5000`. Protected routes need either `Authorization: Bearer <login token>` or an API key (`x-api-key: dpf_...`) with the right scope.

| Method & path | Auth | Scope (API key) | Notes |
|---|---|---|---|
| GET `/health` | none | | 200 ok / 503 database down |
| POST `/api/v1/auth/register` | none | | body `email, password (8-72), displayName` -> 201 token, user, workspace |
| POST `/api/v1/auth/login` | none | | body `email, password` -> token |
| POST `/api/v1/chat` | token or key | `chat` | body `message (<=1000), conversationId?` |
| POST `/api/v1/demo/chat` | none, rate limited | | same body, demo data only |
| POST `/api/v1/demo/reset` | none, rate limited | | resets demo data only |
| GET `/api/v1/customers` | token or key | `customers:read` | query `page, limit (<=50), search` |
| POST `/api/v1/customers` | token or key | `customers:write` | body `name, email, phone?` -> 201, 409 duplicate |
| GET `/api/v1/orders` | token or key | `orders:read` | query `page, limit, status, customerId, customerEmail` |
| PATCH `/api/v1/orders/:id/status` | token or key | `orders:write` | body `status`; 409 invalid transition, 404 not found |
| POST `/api/v1/reports/business-summary` | token or key | `reports:read` | body `fromDate?, toDate?` (YYYY-MM-DD) |
| POST `/api/v1/api-keys` | token only | | body `label, scopes?, expiresInDays?` -> raw key shown ONCE |
| GET `/api/v1/api-keys` | token only | | metadata only |
| DELETE `/api/v1/api-keys/:id` | token only | | revoke |
| GET `/api/v1/usage` | token only | | query `days` (1-90) |

Common status codes: 400 validation, 401 not logged in / bad key, 403 missing scope, 404 not found, 409 conflict, 413 body too large, 429 rate limited, 502 AI service failed.

Order status flow: `pending -> processing -> shipped -> delivered`; `cancelled` allowed from pending or processing. Delivered and cancelled are final.

### curl examples (macOS/Linux/Git Bash; on Windows PowerShell use Postman or `curl.exe` with escaped quotes)
```bash
# Register (returns a token)
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"Password123","displayName":"Me"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"Password123"}'

TOKEN=paste_token_here

# Create and list customers
curl -X POST http://localhost:5000/api/v1/customers -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Ngozi Eze","email":"ngozi@example.com"}'
curl "http://localhost:5000/api/v1/customers?limit=5&search=ngozi" -H "Authorization: Bearer $TOKEN"

# Orders and status change
curl "http://localhost:5000/api/v1/orders?status=pending" -H "Authorization: Bearer $TOKEN"
curl -X PATCH http://localhost:5000/api/v1/orders/ORDER_ID/status -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"processing"}'

# Report
curl -X POST http://localhost:5000/api/v1/reports/business-summary -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{}'

# Chat with the agent
curl -X POST http://localhost:5000/api/v1/chat -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"message":"Show me all pending orders"}'

# Create an API key (copy "key" now - it is never shown again), then use it
curl -X POST http://localhost:5000/api/v1/api-keys -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"label":"My app","scopes":["chat","orders:read"],"expiresInDays":30}'
curl http://localhost:5000/api/v1/orders -H "x-api-key: dpf_your_key_here"

# Public demo (no login)
curl -X POST http://localhost:5000/api/v1/demo/chat -H "Content-Type: application/json" \
  -d '{"message":"Which customers do we have?"}'
curl -X POST http://localhost:5000/api/v1/demo/reset
```
Chat response shape: `{ reply, conversationId, toolCalls: [{ name, ok, error? }] }`. `toolCalls` is the server's real record of what ran and whether it succeeded - use it (not the reply text) to verify actions.

## 7. Architecture
```
Client -> Express (CORS, size limit, rate limit) -> auth -> validation -> controller
       -> agentService -> geminiService -> Gemini
                  ^                |
                  |     functionCall (a request to run a tool)
                  |                v
        toolRegistry (allowlist, scopes, Zod validation) -> businessTools -> MongoDB
```
- Gemini only *asks* for tools. Backend code validates and runs them. Gemini never sees database credentials.
- `businessTools.js` is the single source of business logic; REST routes and the agent both call it.
- Workspace comes from the server (login token -> user -> workspace, API key -> its workspace, demo -> demo workspace). Every query includes `workspace`. Client-sent workspace IDs are ignored.

## 8. Design decisions and trade-offs
- **JWT in the Authorization header** (not cookies): simple, and avoids cross-site cookie problems when the frontend (Netlify) and API (Render) are on different domains. Trade-off: the frontend must store the token; tokens cannot be revoked before they expire (default 1 day).
- **bcryptjs** (pure JavaScript) instead of native bcrypt: installs without a compiler on any machine. Slightly slower than native.
- **API keys hashed with HMAC-SHA256**: keys are long random strings, so a fast keyed hash is safe and allows direct lookup.
- **Scopes apply to the agent too**: Gemini is only shown, and only allowed to run, tools the caller's scopes permit.
- **Revenue** = delivered orders; **pipeline** = pending + processing + shipped; cancelled reported separately.
- **Amounts** are stored as plain numbers (NGN). Fine for a demo; for real money store integer minor units.
- **Agent limits**: max 5 model calls and 6 tool calls per message; identical write calls in one turn are blocked.
- **One shared demo workspace**: all visitors share it and see each other's changes until reset. Reset has a cooldown and its own rate limit.
- **Usage** is recorded for chat requests (agent calls), not for plain REST calls.
- Conversations store only user/assistant text. Prompts are not logged.

## 9. Known limitations / manual checks
- **Not run by the author**: this code was written without network access, so `npm install` and `npm test` have NOT been run yet. Run them first and send any errors back.
- Real Gemini behaviour (Gate C) must be verified on your machine with your key; automated tests use a fake Gemini. The request/response shapes follow the current `@google/genai` docs, but the SDK is still evolving - if a model rejects a request, check the model name and SDK version.
- Rate-limit counters are in memory: they reset on restart and are per server instance (fine for one Render instance).
- Render free instances sleep when idle (first request can be slow). Free-tier terms change - check Render's pricing page.
- Registration reveals whether an email exists (409). Accepted for now.

## 10. Deploy backend on Render (later)
Root Directory `backend`, Build `npm install`, Start `npm start`. Set env vars in the Render dashboard (never commit `.env`): `NODE_ENV=production`, `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `JWT_SECRET`, `API_KEY_SECRET`, `ALLOWED_ORIGINS` (your Netlify URL). In Atlas, allow Render's access under Network Access.

## 11. Review gates checklist
- **A boots**: `npm install`, fill `.env`, `npm run dev`, GET `/health`; remove a variable and confirm a clear startup error.
- **B data/tools**: `npm run seed`; create customer; invalid and duplicate email; list orders by status; pagination; status updates and invalid transitions; report totals vs. the sample figures above.
- **C Gemini**: chat "show pending orders", "add customer ..."; confirm `toolCalls`; compare report numbers with the database; try missing fields and nonsense; confirm failures are reported as failures.
- **D auth/keys/isolation**: register/login; create key (shown once); wrong/expired/revoked keys; two users cannot see each other's data; demo only touches demo data; rate limits.
- **E handoff**: tests pass (`npm test`), no `.env` in Git (`git status`).
