# Language & Linguistics Seminar Series — WSU

Website for the Bi-weekly Research Seminar Series hosted by the Languages and Linguistics Academic Program, School of Arts, Western Sydney University.

**Live site:** hosted on Cloudflare Pages (`ling-seminar-wsu`)

---

## Project Structure

```
/
├── index.html                  # Public-facing website
├── style.css                   # Global styles
├── wrangler.toml               # Cloudflare Pages / Workers config
│
├── admin/
│   ├── index.html              # Admin login page
│   ├── dashboard.html          # Admin dashboard (events, subscribers, tools)
│   ├── setup.html              # First-run setup page (create admin account)
│   └── admin-guide.html        # Usage guide for administrators
│
├── functions/
│   ├── _middleware.js          # Runs on every request — serves maintenance page when site is offline
│   └── api/
│       ├── _helpers.js         # Shared utilities: auth, hashing, JSON response, CORS
│       ├── _email.js           # Email template helpers (welcome & newsletter HTML)
│       ├── auth.js             # POST /api/auth — login; DELETE — logout
│       ├── setup.js            # GET/POST/PUT /api/setup — first-run & credential change
│       ├── events.js           # GET/POST/PUT/DELETE /api/events — seminar event CRUD
│       ├── newsletter.js       # GET/POST/DELETE /api/newsletter — subscriber management
│       ├── notify.js           # POST /api/notify — send newsletter to all subscribers
│       ├── maintenance.js      # GET/POST /api/maintenance — toggle site offline mode
│       ├── rss.js              # GET /api/rss — RSS feed of upcoming events
│       └── seed.js             # POST /api/seed — populate DB with original seminar data
│
├── Abstracts/                  # PDF abstracts for individual talks
├── docs/                       # Source Word documents (abstracts, seminar info)
├── img/                        # Logos, banners, speaker photos
└── favicon/                    # Favicon set (all sizes + webmanifest)
```

---

## How It Works

### Hosting
The site runs entirely on **Cloudflare Pages** (free tier). There is no separate server — everything is handled by **Cloudflare Workers Functions** (the `functions/` directory). Data is stored in **Cloudflare KV** (key-value store), bound to the functions as `CMS_KV`.

### Public Site (`index.html`)
- Displays a list of seminar events fetched from `/api/events`
- Shows a featured "Next Upcoming Event" card with a live countdown
- Includes a newsletter subscription form
- Provides an RSS feed link for calendar/reader apps
- Shows an Acknowledgement of Country overlay on first visit

### Admin Panel (`/admin/`)
Protected by a login session (token stored in `localStorage`). Four tabs:

| Tab | What it does |
|---|---|
| **Events** | Add, edit, and delete seminar events. Filter by year, status, or speaker name. |
| **Subscribers** | View all newsletter subscribers, export as CSV, or remove individuals. |
| **Tools** | Toggle site online/offline, send newsletters, copy RSS URL, seed initial data, clear all events. |
| **Account** | Change admin username and password. |

### Maintenance Mode
The **Site Status** toggle in the Tools tab writes a flag to KV (`site_maintenance = 1`). The middleware (`functions/_middleware.js`) checks this flag on every incoming request and returns a `503` maintenance page to visitors. The admin panel and all `/api/` routes are always accessible regardless of this setting.

### Authentication
- Sessions are stored as KV keys (`session:<token>`) with a 24-hour TTL.
- Credentials can be set two ways:
  - **Environment variables** (`ADMIN_USER` / `ADMIN_PASS`) — set in the Cloudflare Pages dashboard. Takes priority.
  - **KV-stored credentials** — created via `/admin/setup.html` on first run, changeable from the Account tab.

### Email (Newsletter)
Emails are sent via **[Resend](https://resend.com)**. Requires a `RESEND_API_KEY` environment variable set in Cloudflare Pages. Without it, the site and subscriptions still work — only the email sending features are disabled.

---

## Environment Variables

Set these in **Cloudflare Pages → Settings → Environment variables**:

| Variable | Required | Description |
|---|---|---|
| `ADMIN_USER` | Optional* | Admin username (overrides KV-stored credentials) |
| `ADMIN_PASS` | Optional* | Admin password (overrides KV-stored credentials) |
| `RESEND_API_KEY` | Optional | Resend API key — enables welcome & newsletter emails |
| `FROM_EMAIL` | Optional | Sender address (defaults to `seminars@westernsydney.edu.au`) |

*If neither `ADMIN_USER`/`ADMIN_PASS` nor KV credentials exist, the site redirects to `/admin/setup.html` for first-run setup.

---

## KV Storage Keys

| Key | Contents |
|---|---|
| `events` | JSON array of all seminar events |
| `subscribers` | JSON array of newsletter subscribers |
| `admin_credentials` | JSON object with hashed admin username/password |
| `session:<token>` | Login session (TTL: 24 hours) |
| `site_maintenance` | `"1"` = site offline, `"0"` or absent = site online |

---

## Deployment

### Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy . --project-name=ling-seminar-wsu
```

### Push to GitHub
```bash
git push origin main
```

Both steps are needed after any code change — GitHub stores the source, Cloudflare serves the live site.

---

## Versions

| Tag | Description |
|---|---|
| `v1` | Original site — no maintenance mode toggle |
| `main` | Current version — includes offline toggle and School of Arts branding |
