# MediBook

Medical appointment scheduling system for clinics and aesthetic centers. Built with Next.js App Router, PostgreSQL, and Prisma.

---

## Features

- **Daily appointment grid** — Visual slot-based calendar per resource (doctor/equipment)
- **Booking & editing** — Create, edit, and cancel appointments with patient info
- **Multi-resource dashboard** — 3-column grid showing all resources side by side
- **Patient profiles** — Name/phone suggestions, appointment history and financial schema foundations
- **Daily notes** — Auto-saving freeform notes per day (debounced, 1 second)
- **Date navigation** — Browse past/future days, jump via calendar picker
- **Authentication** — NextAuth with credentials provider, JWT sessions
- **Route protection** — Middleware guards all routes except `/login`
- **Greek locale** — Dates formatted in Greek (date-fns el locale)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | NextAuth v4 (Credentials + JWT) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Date utils | date-fns v4 with Greek locale |
| Date picker | react-day-picker |
| Password hashing | bcryptjs |

---

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/  # NextAuth route handler
│   ├── login/                   # Login page
│   ├── actions.ts               # Server actions (DB operations)
│   ├── layout.tsx               # Root layout with SessionProvider
│   └── page.tsx                 # Dashboard (server component)
├── components/
│   ├── DashboardController.tsx  # Main client controller, date state
│   ├── BookingManager.tsx       # Appointment slot grid per resource
│   ├── BookingModal.tsx         # New booking form modal
│   ├── EditModal.tsx            # Edit / cancel booking modal
│   ├── DailyNote.tsx            # Auto-save daily notes textarea
│   ├── DateNavigator.tsx        # Date navigation component
│   └── Providers.tsx            # NextAuth SessionProvider wrapper
├── lib/
│   └── auth.ts                  # NextAuth config (credentials provider)
└── middleware.ts                 # Route protection middleware
prisma/
├── schema.prisma                # DB schema
└── seed-full.ts                 # Seed script
```

---

## Database Schema

### Resource
Represents a bookable resource (doctor, laser machine, etc.)

| Field | Type | Description |
|---|---|---|
| id | Int | Primary key |
| name | String | e.g. "Dr. Papadopoulos" |
| type | String | `MEDICAL` or `AESTHETIC` |

### Appointment
A 15-minute time slot associated with a resource.

| Field | Type | Description |
|---|---|---|
| id | Int | Primary key |
| date | DateTime | Slot date and time |
| status | String | `FREE` or `BOOKED` |
| patientName | String? | Patient full name |
| patientTel | String? | Patient phone |
| notes | String? | Optional notes |
| duration | Int | Duration in minutes (default 30) |
| resourceId | Int | Foreign key to Resource |

> Unique constraint on `(date, resourceId)` — prevents double bookings.

### DayNote
One freeform note per day.

| Field | Type |
|---|---|
| id | Int |
| date | DateTime (unique) |
| content | Text |

### User
Authentication users.

| Field | Type |
|---|---|
| id | Int |
| username | String (unique) |
| password | String (bcrypt hash) |
| role | String (default: `USER`) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. **Clone and install dependencies**

```bash
git clone <repo-url>
cd medi-book
npm install
```

2. **Configure environment**

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/medibook?schema=public"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Push database schema**

```bash
npx prisma db push
```

4. **Seed the database** (optional)

```bash
npx ts-node prisma/seed-full.ts
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

### Dashboard Flow

```
Page (server) → DashboardController (client)
  ├── fetches appointments + day note for selected date
  ├── renders resource grid (3 columns)
  │   └── BookingManager (per resource)
  │       ├── FREE slot → BookingModal → bookAppointment()
  │       └── BOOKED slot → EditModal → updateAppointment() / cancelAppointment()
  └── DailyNote → saveDayNote() (auto-save with 1s debounce)
```

### Server Actions (`src/app/actions.ts`)

| Action | Description |
|---|---|
| `getDayAppointments(date)` | Fetch all resources with their slots for a given day |
| `getDayNote(date)` | Fetch the daily note content |
| `saveDayNote(date, content)` | Upsert daily note (no cache revalidation) |
| `bookAppointment(formData)` | Mark slot as BOOKED, save patient info |
| `updateAppointment(formData)` | Update patient info on existing booking |
| `cancelAppointment(formData)` | Revert slot to FREE, clear patient data |
| `logout()` | Sign out and redirect to /login |

### Appointment Slot Rendering

- Each slot is **15 minutes tall = 60px**
- Appointments longer than 15 minutes span multiple slots proportionally
- Continuation slots (hidden) prevent overlap
- FREE slots show an "Available" label with a Book button
- BOOKED slots show patient name, phone, and duration badge

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run booking and patient identity/access tests
```

---

## Authentication

- Login at `/login` with username and password
- Passwords stored as bcrypt hashes in the database
- JWT session strategy (stateless)
- All routes except `/login` and `/api/auth/*` are protected by middleware

## Updating an existing server deployment

Run as the user that owns the checkout and its PM2 process, inside the site's
repository folder. Node.js 20.9+ is required.

First update (downloads the update script):

```bash
git pull --ff-only origin main && bash update.sh
```

Subsequent updates:

```bash
bash update.sh
```

The script targets the existing PM2 app `medibook`, fast-forward pulls `main`,
installs locked dependencies (including build tools),
generates the Prisma client, builds Next.js, then restarts the existing app.
It stops on errors or local changes. It preserves `.env`. After building, it stops the app, applies the versioned additive
patient migration and backfills profiles/history, then restarts. It never runs a
schema reset or seed script. The migration has an atomic checksum ledger and the
backfill is resumable. If the upgrade fails, the app stays stopped; fix the error
and rerun `bash update.sh`. Run it during a quiet period: the
production build is updated in place; this is not an atomic or zero-downtime deploy.
A build failure prevents the database upgrade and restart but does not roll back files or dependencies.

If the PM2 process is renamed, specify its existing process name:

```bash
PM2_APP=your-app-name bash update.sh
```

For an existing system-level systemd service instead of PM2:

```bash
SYSTEMD_SERVICE=your-service.service bash update.sh
```

The systemd mode may ask for sudo credentials. A successful restart is not an
HTTP health check; verify the deployed site after the script finishes.


## Patient profiles and history

- `Patient`: name, phone, normalized identity, clinic scope, optional email,
  date of birth and profile notes. Exact normalized name **and** phone are used
  together; a shared family phone alone never merges different names. Name/phone
  corrections that no longer match are treated as a different identity; there is
  no automatic fuzzy merge or global cross-clinic patient directory.
- `PatientVisit`: stable history linked to a patient and resource, with a nullable
  unique link to the reusable calendar slot. Rescheduling moves the link and
  updates the same visit. Cancellation preserves the visit and releases the slot.
  Statuses support scheduled, completed, cancelled and no-show visits. Old bookings
  remain scheduled: elapsed time is not evidence that the patient attended.
- Finance foundation: a nullable decimal charge and currency on each visit, plus
  separate decimal payment rows with payment date, method, reference and notes.
  Multiple payments support deposits/installments. Unknown charges are `NULL`,
  and no payment records are inferred. Payment entry, refunds and receipt handling
  are future features; the current profile displays recorded financial data.
- Search and history use the calendar's existing access rules. A group shares
  patient identities; ungrouped resources get separate identity scopes. Visit
  history is additionally filtered to the resources the signed-in user can see.
- The first deployment links existing `BOOKED` appointments with complete name
  and phone to profiles and visits. Incomplete records are kept unchanged and
  counted in the upgrade output. Previously erased cancellations cannot be
  reconstructed. No existing appointment date, duration, note or status is changed.

For this first schema upgrade, download the updated script before executing it:

```bash
git pull --ff-only origin main && bash update.sh
```

`npm run db:upgrade` applies `prisma/upgrades/001-patient-profiles.sql` once using
`_MediBookUpgrade` and then resumes any missing history links. This repository has
an existing database without Prisma migration history, so it uses an explicit
additive upgrade rather than pretending the database is empty or baselining it
blindly. Do not modify a migration after it has been applied.
