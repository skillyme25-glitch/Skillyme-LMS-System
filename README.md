# Skillyme Africa LMS — Cohort 2: Build Track

A full-stack cohort management platform for the Skillyme Africa startup accelerator. Manage participants, teams, milestones, calendar events, announcements, and real-time notifications.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 (via Docker) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Realtime | Server-Sent Events (SSE) |
| Email | Nodemailer |
| Jobs | node-cron |

---

## Prerequisites

- **Node.js** 18 or later
- **Docker Desktop** (for PostgreSQL)
- **npm** or **pnpm**

---

## Setup (5 steps)

### 1. Clone and install

```bash
git clone <repo-url>
cd "SKILLYME AFRICA LMS"

# Install root dependencies (Prisma CLI, concurrently)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (matches docker-compose) |
| `JWT_ACCESS_SECRET` | 64-byte random hex — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Different 64-byte random hex |
| `SMTP_HOST / SMTP_USER / SMTP_PASS` | Gmail SMTP (or leave blank — emails log to console) |
| `FRONTEND_URL` | `http://localhost:5173` |
| `PORT` | `4000` |
| `PROGRAM_NAME` | Displayed in the UI and emails |

### 3. Start the database

```bash
docker compose up -d
```

Verify: `docker ps` should show `skillyme-db` running.

### 4. Run database migrations and seed

```bash
# Generate Prisma client + run migrations
npm run db:generate
npm run db:migrate

# Seed with sample data
npx prisma db seed
```

### 5. Start the dev server

```bash
npm run dev
```

This starts both:
- **Backend** at http://localhost:4000
- **Frontend** at http://localhost:5173

---

## First Login

| Role | Email | Password |
|---|---|---|
| **Super Admin** | admin@skillyme.africa | Admin@1234 |
| Facilitator | facilitator@skillyme.africa | Facilitator@1234 |
| Mentor | mentor@skillyme.africa | Mentor@1234 |
| Member (Alice) | alice@example.com | Member@1234 |

---

## Inviting Your First Real Participant

1. Log in as Super Admin
2. Go to **Admin → Participants**
3. Click **Invite Participant**
4. Fill in name, email, role, and (optionally) team + functional role
5. Click **Send Invitation**

The invitee receives an email with a link to set their password. If SMTP is not configured, the link is logged to the server console.

---

## How Real-Time Notifications Work

The frontend connects to `GET /api/notifications/stream` via **Server-Sent Events** as soon as the user logs in. The server pushes a JSON payload whenever a new notification is created for that user. The notification bell badge and dropdown update instantly — no page refresh required.

In production behind a reverse proxy (nginx/Caddy):
- Disable response buffering for the SSE route
- For nginx: `proxy_buffering off; proxy_cache off;`

---

## Scheduled Jobs

Three cron jobs run inside the server process:

| Job | Schedule | Purpose |
|---|---|---|
| Milestone reminders | 8:00 AM EAT daily | Emails + notifications when a milestone is due in < 48h |
| Session reminders | 8:00 AM EAT daily | Emails + notifications for sessions starting in ~24h |
| Expired invite cleanup | Every hour | Flags expired invitations for admin review |

---

## Resetting to Live Data

The seed data (Team Alpha/Beta/Gamma, sample members, sessions) is for testing only. Before going live:

```bash
npm run db:reset-live
```

This deletes all program data but **keeps your SUPER_ADMIN account**. You can then:
1. Create real teams via Admin → Teams
2. Invite real participants via Admin → Participants
3. Set real milestone due dates via Admin → Milestones
4. Update session links in the Calendar

---

## API Overview

All API routes are under `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

| Route | Method | Auth |
|---|---|---|
| `/api/auth/login` | POST | Public |
| `/api/auth/accept-invite` | POST | Public |
| `/api/auth/refresh` | POST | Public |
| `/api/auth/me` | GET | Any role |
| `/api/admin/users` | GET/POST | Admin/Facilitator |
| `/api/admin/teams` | GET/POST | Admin/Facilitator |
| `/api/admin/dashboard` | GET | Admin/Facilitator |
| `/api/milestones` | GET/POST/PATCH | Authenticated |
| `/api/teams/:id/milestones` | GET/PATCH | Role-gated |
| `/api/calendar` | GET/POST/PATCH/DELETE | Authenticated |
| `/api/calendar/:id/ics` | GET | Authenticated |
| `/api/announcements` | GET/POST/PATCH/DELETE | Authenticated |
| `/api/notifications` | GET/PATCH | Authenticated |
| `/api/notifications/stream` | GET (SSE) | Authenticated |
| `/api/profile` | GET/PATCH | Authenticated |
| `/api/config` | GET | Public |

---

## Project Structure

```
/
├── client/           # React frontend (Vite)
│   └── src/
│       ├── api/      # Axios client + endpoint functions
│       ├── components/  # UI components + layout
│       ├── hooks/    # useAuth, useSSE
│       ├── pages/    # All route pages + admin sub-pages
│       ├── store/    # Auth state (localStorage)
│       └── types/    # TypeScript interfaces
├── server/           # Express backend
│   └── src/
│       ├── config/   # Prisma client + env
│       ├── middleware/  # auth, roles, errorHandler, validate
│       ├── routes/   # All API routes
│       └── services/ # email, notifications, SSE store, cron
├── prisma/
│   ├── schema.prisma # Database schema
│   ├── seed.ts       # Sample data
│   └── reset-live.ts # Wipe data, keep admin
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret for access tokens (64-byte hex) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for refresh tokens (64-byte hex) |
| `JWT_ACCESS_EXPIRY` | | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | | `7d` | Refresh token lifetime |
| `SMTP_HOST` | | — | SMTP server hostname |
| `SMTP_PORT` | | `587` | SMTP port |
| `SMTP_USER` | | — | SMTP username |
| `SMTP_PASS` | | — | SMTP password/app password |
| `SMTP_FROM` | | — | Sender address in emails |
| `ADMIN_EMAIL` | | admin@skillyme.africa | Shown in emails for support contact |
| `FRONTEND_URL` | | http://localhost:5173 | Used in invitation email links |
| `PORT` | | `4000` | Backend server port |
| `PROGRAM_NAME` | | `Skillyme Africa — Cohort 2: Build Track` | Displayed in UI and emails |
| `MAX_UPLOAD_SIZE` | | `5242880` | Max file upload size in bytes |
| `UPLOAD_DIR` | | `uploads` | Directory for uploaded files |
