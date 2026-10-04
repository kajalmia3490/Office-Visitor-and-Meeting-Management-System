# Setup, Running & Deployment

This is the backend of the **Office Visitor & Meeting Management System**. The
full specification lives in [readme.md](readme.md).

Stack: Node.js (>= 20) · Express 5 · MongoDB Atlas · Mongoose · Better Auth
(email/password + Google) · Zod · Socket.IO (optional) · Jest + Supertest.

---

## 1. Prerequisites

- Node.js 20 or newer (developed on Node 24).
- A MongoDB Atlas cluster (the free tier is enough).
- Optional: a Google Cloud OAuth client for "Sign in with Google".

## 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | Atlas connection string: Atlas → *Connect* → *Drivers*. Allow your IP under *Network Access*. |
| `MONGODB_DB_NAME` | Database name (e.g. `office_visitor_management`). |
| `BETTER_AUTH_SECRET` | Random string, at least 32 characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `BETTER_AUTH_URL` | Public base URL of this API, e.g. `http://localhost:5000`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Authorized redirect URI: `http://localhost:5000/api/auth/callback/google`. Leave empty to disable Google sign-in. |
| `CLIENT_URL` | Comma-separated frontend origins allowed by CORS and Better Auth. |
| `PASS_DEFAULT_VALIDITY_HOURS` | Default visitor pass validity (default 8, max 72). |
| `ADMIN_EMAIL` / `ADMIN_NAME` | Used by `npm run seed` to create the first admin. |

## 3. Install and seed

```bash
npm install
npm run seed     # creates departments, meeting rooms and the admin profile for ADMIN_EMAIL
```

## 4. Run

```bash
npm run dev      # nodemon, auto-reload
npm start        # production mode
```

- API base: `http://localhost:5000/api/v1`
- Swagger UI: `http://localhost:5000/api-docs` (raw spec: `/api-docs.json`)
- Health check: `http://localhost:5000/health`

## 5. Authentication flow

Better Auth is mounted at `/api/auth/*`. The session cookie it sets is used by
every `/api/v1` endpoint.

```bash
# Create an account (email/password)
curl -i -c cookies.txt -X POST http://localhost:5000/api/auth/sign-up/email \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"name":"Admin","email":"admin@example.com","password":"StrongPass123"}'

# Sign in
curl -i -c cookies.txt -X POST http://localhost:5000/api/auth/sign-in/email \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"admin@example.com","password":"StrongPass123"}'

# Call the API with the session cookie
curl -b cookies.txt http://localhost:5000/api/v1/auth/me
```

Google sign-in: the frontend calls `POST /api/auth/sign-in/social` with
`{ "provider": "google", "callbackURL": "<frontend url>" }` (or uses the Better
Auth client `authClient.signIn.social({ provider: "google" })`).

**Application roles.** The first time someone signs in, the API links them to an
existing application profile with the same email (for example the seeded admin).
If no profile exists, it creates one with the `employee` role. Admins change
roles through `PATCH /api/v1/users/:id`. The API never trusts a role sent by the
client.

Better Auth stores its own data in the `user`, `session`, `account` and
`verification` collections. These are separate from the business collections
(`users`, `visitors`, `visits`, ...).

## 6. Real-time notifications (optional)

Socket.IO runs on the same port. Connect with the session cookie
(`withCredentials: true`). The server then sends `notification:new` events to the
signed-in user. Every notification is also stored in MongoDB, so the
`/api/v1/notifications` endpoints always have the full list.

## 7. Background housekeeping

Every minute the server:

- moves meetings to `ongoing` / `completed` based on time,
- marks approved appointments that were never checked in as `no_show`,
- expires visitor passes past their `expiresAt`.

## 8. Tests

```bash
npm test
```

Tests run against an in-memory MongoDB (`mongodb-memory-server`), so Atlas
is never used. On the first run the MongoDB binary is downloaded and cached.
The Better Auth session lookup is replaced with a test double, so each role
can be simulated through a request header.

## 9. Production deployment checklist

- Set `NODE_ENV=production` and serve over HTTPS. Secure cookies are enabled automatically.
- Set `BETTER_AUTH_URL` to the public API URL and add the production Google redirect URI
  (`https://<api-host>/api/auth/callback/google`).
- Restrict `CLIENT_URL` to the real frontend origin(s).
- Restrict Atlas network access to the server's IP addresses.
- Keep `.env` out of git (already listed in `.gitignore`); use the host's secret manager.
- Run `npm run seed` once against the production database to create the first admin.
- Run behind a reverse proxy/load balancer (`trust proxy` is enabled for correct client IPs
  in rate limiting and audit logs). If you run several instances, add a Socket.IO adapter
  (e.g. Redis) for real-time delivery.
- Example with PM2: `pm2 start src/server.js --name office-visitor-api`.
