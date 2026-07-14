# York Central — Scheduling

A private, single-tenant alternative to Doodle purpose-built for one company's
admin(s) to schedule recurring meetings with outside consultants, engineers,
architects, and subcontractors — without those participants ever creating an
account. Rebranded and restyled as a native York Central product; see
**`YORK_DESIGN_SYSTEM.md`** for the full color/type/component system this
codebase implements.

- **Admin** signs in, creates a poll, lists candidate timeslots and
  participants, and gets a shareable link.
- **Participants** open the link, type their name, tick their availability,
  and submit. No login, no app, no install.
- **SiteSync** ranks every timeslot by attendance, handles ties, and
  highlights the recommended time.

---

## 1. Architecture

```
┌──────────────────────┐        ┌──────────────────────────┐
│   Browser (admin)     │        │   Browser (participant)   │
│  /login, /dashboard/* │        │      /poll/[slug]         │
└──────────┬────────────┘        └────────────┬──────────────┘
           │ HTTPS                            │ HTTPS (no auth)
           ▼                                   ▼
┌──────────────────────────────────────────────────────────────┐
│                Next.js 14 (App Router) on Node.js             │
│  ─ Server Components: dashboard pages, poll detail page       │
│  ─ Client Components: forms, matrix, live results             │
│  ─ Route Handlers (/api/*): REST-ish JSON API, see §5          │
│  ─ Middleware: gates /dashboard/* on a signed session cookie  │
└───────────────────────────┬────────────────────────────────────┘
                            │ Prisma Client
                            ▼
                  ┌───────────────────────┐
                  │   PostgreSQL          │
                  │ (Railway / Supabase)  │
                  └───────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      Resend / SMTP (invites)     Cloudflare Turnstile (optional CAPTCHA)
```

**Why this shape:** the whole point of the product is "one link, zero
friction," so the public poll page and its two API routes
(`/api/polls/[slug]/public`, `/api/polls/[slug]/responses`) deliberately have
**no auth** — they're gated only by the unguessable `slug` and, for
returning visitors, a private `editToken`. Every other route under
`/api/polls` and the whole `/dashboard` tree requires the admin session
cookie, enforced twice (defense in depth): once in `middleware.ts` for pages,
and again inside each route handler via `getCurrentAdmin()` since middleware
doesn't cover Route Handlers called directly.

## 2. Tech stack

| Layer          | Choice                                    |
|----------------|--------------------------------------------|
| Frontend       | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend        | Next.js Route Handlers, Node.js, TypeScript (strict) |
| Database       | PostgreSQL                                  |
| ORM            | Prisma                                      |
| Auth           | Admin-only, JWT session cookie (`jose`), bcrypt password hashing |
| Validation     | Zod on every mutating route                 |
| Email          | Resend (default) or SMTP via Nodemailer     |
| Exports        | `csv-parse`/hand-rolled CSV, `pdf-lib` for PDF |
| Testing        | Vitest                                      |
| Hosting        | Vercel (app) + Railway/Supabase (Postgres)  |

## 3. Folder structure

```
sitesync-scheduler/
├─ YORK_DESIGN_SYSTEM.md      # Phase 1 design system doc (colors, type, components)
├─ prisma/
│  ├─ schema.prisma          # Admin, Poll, Timeslot, Participant, Response, Invitation
│  └─ seed.ts                 # creates the first admin account
├─ src/
│  ├─ middleware.ts           # protects /dashboard/*
│  ├─ app/
│  │  ├─ page.tsx             # marketing/landing page (York branded)
│  │  ├─ login/page.tsx       # admin sign-in
│  │  ├─ poll/[slug]/page.tsx # PUBLIC participant page (no auth)
│  │  ├─ dashboard/
│  │  │  ├─ layout.tsx        # York header + secondary nav + admin identity
│  │  │  ├─ page.tsx          # Active Polls: featured hero + grid
│  │  │  ├─ upcoming/page.tsx      # Upcoming Meetings
│  │  │  ├─ completed/page.tsx     # Completed Polls
│  │  │  ├─ templates/page.tsx     # Recurrence templates
│  │  │  ├─ analytics/page.tsx     # Executive analytics dashboard
│  │  │  ├─ administration/page.tsx# Admin account & platform settings
│  │  │  └─ polls/
│  │  │     ├─ new/page.tsx   # 4-step poll creation wizard
│  │  │     └─ [slug]/page.tsx# poll detail / results / actions
│  │  └─ api/
│  │     ├─ auth/{login,logout}/route.ts
│  │     ├─ polls/route.ts               # GET list / POST create
│  │     ├─ polls/[slug]/route.ts        # GET/PATCH/DELETE (admin)
│  │     ├─ polls/[slug]/public/route.ts # GET (public, no auth)
│  │     ├─ polls/[slug]/responses/route.ts # POST (public, no auth)
│  │     ├─ polls/[slug]/duplicate/route.ts
│  │     ├─ polls/[slug]/invite/route.ts # send invites / reminders
│  │     ├─ participants/import/route.ts # CSV import
│  │     └─ export/[slug]/{csv,pdf}/route.ts
│  ├─ components/
│  │  ├─ ui/                  # Button, Card, Field, Modal — York primitives
│  │  ├─ Header.tsx            # York Construction | search | York Realty
│  │  ├─ SecondaryNav.tsx       # Active Polls / Upcoming / Completed / Templates / Analytics / Administration
│  │  ├─ HeroFeaturedPoll.tsx   # dashboard hero banner
│  │  ├─ PollCard.tsx / PollGrid.tsx  # poll cards + list actions
│  │  ├─ PollWizard.tsx         # 4-step poll creation flow
│  │  ├─ ResultsMatrix.tsx      # the availability matrix (core feature)
│  │  ├─ AvailabilityForm.tsx   # public participant response form
│  │  ├─ PollDetailClient.tsx   # admin poll detail actions
│  │  └─ StatusBadge.tsx / SignOutButton.tsx
│  └─ lib/
│     ├─ db.ts                 # Prisma client singleton
│     ├─ auth.ts                # session cookie + password hashing
│     ├─ scheduling.ts          # tallying, ranking, tie handling (unit tested)
│     ├─ validation.ts          # Zod schemas
│     ├─ rate-limit.ts          # in-memory fixed-window limiter
│     ├─ captcha.ts             # Turnstile verification
│     ├─ mailer.ts              # Resend/SMTP + York-branded email templates
│     ├─ csv.ts / pdf.ts        # exports (PDF uses York navy/gold)
│     └─ export-data.ts         # shared loader for both exports
├─ .env.example
├─ package.json
└─ README.md (this file)
```

## 4. Database schema

See `prisma/schema.prisma` for the authoritative definitions. Summary:

- **Admin** — the only account type. One admin owns many polls.
- **Poll** — the shareable unit. Has a `slug` (public link token), `status`
  (`DRAFT`/`ACTIVE`/`COMPLETED`/`ARCHIVED`), `cadence`
  (`ONE_OFF`/`WEEKLY`/`BIWEEKLY`/`MONTHLY`), and toggles for email
  requirement, edit-after-submit, notifications, CAPTCHA.
- **Timeslot** — a candidate meeting time on a poll, with `sortOrder`.
- **Participant** — identified only by `name` (+ optional `email`), unique
  per poll, plus a private `editToken` so a returning visitor can update
  their answers without an account.
- **Response** — one participant's `YES`/`MAYBE`/`NO` for one timeslot.
- **Invitation** — tracks optional email invites/reminders and their status.

## 4b. UI wireframes

**Participant view — `/poll/[slug]`** (this is the page that has to work
perfectly on a phone in a truck cab):

```
┌───────────────────────────────────────────┐
│ ▓▓▓▓▓ blueprint header ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ AVAILABILITY POLL                          │
│ Weekly OAC Meeting — Riverside Tower       │
├───────────────────────────────────────────┤
│ Coordinate schedule, RFIs, submittals...   │
│                                             │
│ Your name  [______________]                │
│ Email (optional) [______________]          │
│                                             │
│ When are you available?                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Mon Jul 13, 9:00 AM   [Yes][Maybe][No]  │ │
│ │ Mon Jul 13, 10:00 AM  [Yes][Maybe][No]  │ │
│ │ Tue Jul 14, 1:00 PM   [Yes][Maybe][No]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│           [ Submit availability ]          │
│                                             │
│ Results so far · 4 responded               │
│ Currently leading: Tue Jul 14, 1:00 PM      │
│ ┌─────────────────────────────────────────┐ │
│ │ Tue Jul 14 1:00 PM   3 yes · 1 maybe 75%│ │ ← amber highlight
│ │ Mon Jul 13 9:00 AM   2 yes · 0 maybe 50%│ │
│ │ Mon Jul 13 10:00 AM  1 yes · 1 maybe 25%│ │
│ └─────────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**Admin poll detail — `/dashboard/polls/[slug]`** (the Doodle-style matrix,
sticky-header, with the recommended column stamped):

```
┌──────────────────────────────────────────────────────────────────┐
│ Weekly OAC Meeting — Riverside Tower  [ACTIVE]                    │
│ 4 of 6 responded                                                  │
│ [Copy link] [Send invites] [Send reminders] [Export CSV] [PDF]…  │
├──────────────────────────────────────────────────────────────────┤
│ Participant │ Mon 9AM │ Mon 10AM │ Tue 1PM ★RECOMMENDED★         │
│─────────────┼─────────┼──────────┼────────────────────────────── │
│ J. Reyes    │   ✓     │          │        ✓                      │
│ A. Chen     │   ✓     │    ✓     │        ✓                      │
│ M. Okafor   │         │    ~     │        ✓                      │
│─────────────┼─────────┼──────────┼────────────────────────────── │
│ Available   │  2 (50%)│  1 (25%) │       3 (75%)                 │
│ Rank        │   #2    │    #3    │        #1                     │
└──────────────────────────────────────────────────────────────────┘
```

**Dashboard poll list — `/dashboard`**:

```
┌───────────────────────────────────────────────────┐
│ SiteSync                    [+ New poll]  you@co ▾ │
├───────────────────────────────────────────────────┤
│ [ALL] [ACTIVE] [COMPLETED] [ARCHIVED]              │
│ ┌─────────────────────────────────────────────────┐│
│ │ Weekly OAC Meeting — Riverside Tower    ACTIVE   ││
│ │ 6 timeslots · 4/6 responded                      ││
│ │            [Copy link][Duplicate][Archive][Del]  ││
│ ├─────────────────────────────────────────────────┤│
│ │ Foundation pour coordination            COMPLETED││
│ │ 3 timeslots · 8/8 responded                      ││
│ └─────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────┘
```



All routes return JSON. Admin routes require the `sitesync_session` cookie
(set by `/api/auth/login`); public routes are noted.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | — | Sign in, rate-limited (10/15min per IP) |
| POST | `/api/auth/logout` | admin | Clear session |
| GET | `/api/polls?status=` | admin | List the admin's polls |
| POST | `/api/polls` | admin | Create a poll (timeslots, participants, optional invite send) |
| GET | `/api/polls/:slug` | admin | Full poll detail incl. responses |
| PATCH | `/api/polls/:slug` | admin | Update fields / status (archive, reactivate) |
| DELETE | `/api/polls/:slug` | admin | Delete poll + cascade |
| POST | `/api/polls/:slug/duplicate` | admin | Clone poll, shift timeslots by cadence |
| POST | `/api/polls/:slug/invite` | admin | Send invites or reminders |
| **GET** | `/api/polls/:slug/public` | **public** | Poll + live tallies + (if `?token=`) the caller's own prior answers |
| **POST** | `/api/polls/:slug/responses` | **public** | Submit/update availability, rate-limited (20/10min per IP) |
| POST | `/api/participants/import` | admin | Parse an uploaded CSV of participants |
| GET | `/api/export/:slug/csv` | admin | Download results as CSV |
| GET | `/api/export/:slug/pdf` | admin | Download results as PDF |

## 6. Scheduling intelligence

`src/lib/scheduling.ts` (unit tested in `src/lib/__tests__/scheduling.test.ts`):

- **Score** = `yes + maybe × 0.5` per timeslot.
- **Rank** — slots sorted by score desc, tie-broken by start time; equal
  scores share the same rank number and the next rank skips ahead (1, 1, 3 —
  never 1, 1, 2), matching how people actually read a leaderboard.
- **Recommended** — every timeslot at the top score is flagged, so genuine
  ties are shown as ties rather than picking one arbitrarily.
- **Percentage** — yes-votes divided by total known participants (not just
  respondents to that slot), so it reflects real attendance likelihood.

## 7. Security

- **No participant accounts** — the attack surface for the public side is
  intentionally tiny: two routes, no cookies, no PII beyond name/email.
- **Unguessable links** — `slug` and `editToken` are `cuid()`s (122 bits of
  entropy), not sequential IDs.
- **Rate limiting** — per-IP fixed-window limits on login and response
  submission (see `src/lib/rate-limit.ts`). Swap for Upstash Redis if you
  run more than one instance.
- **Optional CAPTCHA** — per-poll toggle, verified server-side against
  Cloudflare Turnstile (`src/lib/captcha.ts`).
- **HTTPS** — enforced by the hosting platform (Vercel/Railway terminate TLS
  automatically); `next.config.js` sets `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Password storage** — bcrypt, cost factor 12.
- **Sessions** — signed JWT in an `httpOnly`, `sameSite=lax` cookie, secure
  in production, 7-day expiry.
- **Ownership checks** — every admin route re-verifies `poll.adminId ===
  session.adminId`, not just "is logged in," so one admin can't read or
  edit another admin's polls if you add more admins later.
- **Constant-shape auth errors** — login returns the same error whether the
  email doesn't exist or the password is wrong.

## 8. Scalability

- **Stateless app tier** — Next.js route handlers hold no in-memory state
  except the rate limiter, so you can run multiple instances once you move
  that to Redis (see the comment in `rate-limit.ts`).
- **Indexes** — `@@index` on `Poll.adminId+status`, `Timeslot.pollId`,
  `Participant.pollId`, `Response.timeslotId` cover the hot queries
  (dashboard list, matrix load, tally computation).
- **Pagination-ready** — `Poll.findMany` in the dashboard is a small admin's
  poll count today; add `take`/`skip` or cursor pagination before an admin
  has hundreds of polls.
- **Read-heavy public page** — the participant page fetches once and
  recomputes tallies client-visible on submit; for very high-traffic single
  polls, add a short-TTL cache (e.g. `unstable_cache` or a CDN edge cache) on
  `/api/polls/:slug/public`.
- **DB connections** — serverless deployments should use Prisma's connection
  pooling (`?pgbouncer=true&connection_limit=1` on `DATABASE_URL`, or
  Prisma Accelerate) to avoid exhausting Postgres connections across many
  lambda invocations.

## 9. Testing strategy

- **Unit** — `src/lib/scheduling.ts` (ranking/ties/percentages) is fully
  covered in `src/lib/__tests__/scheduling.test.ts` (`npm test`). This is
  the highest-value place for unit tests: it's pure logic with real edge
  cases (ties, all-zero polls, percentage base).
- **Integration (recommended next)** — spin up a throwaway Postgres
  (Docker or `prisma migrate dev` against a test DB) and hit the route
  handlers directly with `next/experimental-testing` or a lightweight
  supertest-style harness, covering: poll creation → public fetch →
  response submit → tally correctness → export.
- **E2E (recommended next)** — Playwright covering the full admin flow
  (create poll → copy link) and participant flow (open link → submit → see
  results), plus the "returning visitor edits their answer" path.
- **Manual QA checklist** — see the launch checklist below; mobile Safari
  and a real construction-industry participant (non-technical) are the two
  most valuable manual testers for this product.

## 10. Local development

```bash
cp .env.example .env
# fill in DATABASE_URL (a local or hosted Postgres) and AUTH_SECRET

npm install
npm run prisma:migrate      # creates tables
npm run seed                # creates admin@example.com / change-this-password
npm run dev                 # http://localhost:3000

If you are running locally without a .env file, the app will use a development-only default auth secret so sign-in works for local testing. For a production-like setup, create a .env with a real AUTH_SECRET and DATABASE_URL.
```

Sign in at `/login`, create a poll, copy its link, open it in an incognito
window to act as a participant.

### Local development without Postgres

If you just want to click through the UI without standing up Postgres,
temporarily switch the datasource in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

SQLite doesn't support every Postgres feature Prisma can use, but this
schema is simple enough that it works for local exploration. Switch back to
`postgresql` before deploying.

## 11. Deployment (Vercel + Railway/Supabase)

1. **Database** — create a Postgres instance on Railway or Supabase. Copy
   its connection string into `DATABASE_URL`.
2. **Run migrations** once against that database:
   ```bash
   DATABASE_URL="..." npm run prisma:deploy
   DATABASE_URL="..." SEED_ADMIN_EMAIL=you@company.com SEED_ADMIN_PASSWORD="a-strong-password" npm run seed
   ```
3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Set these environment variables in the Vercel project settings:
   `DATABASE_URL`, `AUTH_SECRET` (generate with `openssl rand -base64 32`),
   `APP_URL` (your production URL), plus email vars if you want invites.
4. **Add the Prisma generate step** — Vercel's build runs `npm run build`;
   ensure `postinstall` triggers `prisma generate` (add
   `"postinstall": "prisma generate"` to `package.json` if your platform
   doesn't do this automatically — Vercel usually does).
5. **Custom domain / HTTPS** — handled automatically by Vercel.

## 12. Environment variables

See `.env.example` for the full list with comments. Required for a minimal
deployment: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`. Everything else
(email provider, CAPTCHA, calendar integrations) is optional and the app
degrades gracefully — e.g. invites just get logged and skipped if no email
provider is configured.

## 13. Nice-to-have features — status

Implemented in this codebase:
- ✅ CSV import of participants (`/api/participants/import`)
- ✅ Poll duplication / recurrence shift by cadence
- ✅ Automatic timezone capture from the browser on poll creation
- ✅ Optional company logo URL per poll (`Poll.logoUrl` — render it in
  `AvailabilityForm` header once you have a real asset host)
- ✅ Dark mode is wired at the Tailwind config level (`darkMode: 'class'`);
  add a toggle that sets `class="dark"` on `<html>` to switch it on

Documented but not built (would need external accounts/credentials to
build and test properly):
- **Google Calendar / Outlook / Microsoft 365 integration** — the cleanest
  approach is an OAuth connect flow per admin (store refresh tokens on
  `Admin`), then push the winning timeslot as a calendar event once a poll
  is marked `COMPLETED`. `GOOGLE_CLIENT_ID/SECRET` and
  `MICROSOFT_CLIENT_ID/SECRET` are already stubbed in `.env.example` for
  this.
- **Daily response summary emails** — `Poll.dailySummary` exists in the
  schema and toggle in the poll form; wire it to a scheduled job (Vercel
  Cron or a Railway cron service) that queries polls with the flag set and
  calls `sendEmail`.

## 14. Production launch checklist

- [ ] `AUTH_SECRET` is a freshly generated 32+ byte random value (not the
      `.env.example` placeholder)
- [ ] Seeded admin password changed from the seed default
- [ ] `DATABASE_URL` points at production Postgres with SSL enabled
- [ ] `APP_URL` matches the real production domain (used in email links)
- [ ] Email provider configured and a test invite sent end-to-end
- [ ] CAPTCHA keys added if any public poll will be shared outside a known
      group
- [ ] Rate limiter reviewed — if deploying more than one instance, swap the
      in-memory limiter for Upstash Redis
- [ ] Run through the full flow on an actual phone (iOS Safari + Android
      Chrome), since participants will mostly be on-site on mobile
- [ ] Confirm sticky headers and horizontal scroll behave on a poll with 15+
      timeslots and 20+ participants
- [ ] Export CSV and PDF from a real poll and open both
- [ ] Verify archived/completed polls correctly reject new submissions
- [ ] Backups: confirm your Postgres host's automatic backup schedule
- [ ] Error monitoring (Sentry or platform logs) wired up for the API
      routes before relying on this for real project schedules

---

Built for the "one link, zero friction" workflow — the moment any part of
this starts asking a consultant to create an account, that's a regression.
