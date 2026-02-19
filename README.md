# MediBook

> **The Next-Gen Medical Management Platform**

**MediBook** is a high-performance, type-safe medical ecosystem designed for modern clinics and private practices. It leverages the **"1% Stack"** to provide a lightning-fast experience for both healthcare providers and patients.

## ⚡ The 1% Stack

Built with the most efficient tools in the industry to ensure maximum performance and developer productivity:

* **Framework:** [Next.js 14+](https://www.google.com/search?q=https://nextjs.org/) (App Router & Server Actions)
* **Database:** PostgreSQL
* **ORM:** [Drizzle ORM](https://www.google.com/search?q=https://orm.drizzle.team/) (The fastest TypeScript ORM)
* **Styling:** [Tailwind CSS](https://www.google.com/search?q=https://tailwindcss.com/)
* **Components:** [Shadcn UI](https://www.google.com/search?q=https://ui.shadcn.com/)
* **Validation:** [Zod](https://www.google.com/search?q=https://zod.dev/)
* **Icons:** [Lucide React](https://www.google.com/search?q=https://lucide.dev/)

## 🛠 Features

* **Smart Scheduling:** Real-time appointment booking with collision detection.
* **Patient Records (EMR):** Secure and structured storage of patient history and clinical notes.
* **Type-Safe API:** End-to-end type safety using Next.js Server Actions.
* **Modern UI:** Dark/Light mode support with a focus on medical accessibility.
* **Fast Search:** Optimized database queries for instant patient retrieval.

* **Declarative Data Processing:** Utilized stream-like functional patterns in JavaScript (filter, map, reduce) for efficient and readable appointment filtering.

## 📂 Architecture

```text
src/
├── app/            # App Router (Pages & Layouts)
├── components/     # Reusable UI components (Shadcn)
├── db/             # Database schema, migrations & Drizzle config
├── lib/            # Shared logic (auth, validators, utils)
└── server/         # Server Actions & backend logic

```

## 🚀 Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/medibook.git

```


2. **Install dependencies:**
```bash
npm install

```


3. **Environment Setup:**
Create a `.env` file with your `DATABASE_URL`.
4. **Database Sync:**
```bash
npx drizzle-kit push:pg

```


5. **Run Dev Server:**
```bash
npm run dev

```
