# MediBook

Medical appointment scheduling system for clinics and aesthetic centers. Built with Next.js App Router, PostgreSQL, and Prisma.

---

## Features

- **Daily appointment grid** — Visual slot-based calendar per resource (doctor/equipment)
- **Booking & editing** — Create, edit, and cancel appointments with patient info
- **Multi-resource dashboard** — 3-column grid showing all resources side by side
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
```

---

## Authentication

- Login at `/login` with username and password
- Passwords stored as bcrypt hashes in the database
- JWT session strategy (stateless)
- All routes except `/login` and `/api/auth/*` are protected by middleware
