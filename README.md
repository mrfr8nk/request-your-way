<div align="center">

<img src="public/favicon.ico" alt="St. Mary's Logo" width="80" />

# St. Mary's High School Management System

**A full-stack school management platform built for Zimbabwe's curriculum — ZJC, O Level & A Level**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Supabase Database Setup (from zero)](#supabase-database-setup-from-zero)
  - [Environment Variables](#environment-variables)
  - [Deploy Edge Functions](#deploy-edge-functions)
  - [WhatsApp Bot Setup](#whatsapp-bot-setup)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [Credits](#credits)

---

## Overview

St. Mary's High School Management System is a comprehensive, role-based web application designed to digitise every aspect of school administration. From grade entry and attendance tracking to fee management, real-time messaging, AI tutoring, and security monitoring — everything is handled in one unified platform.

The system is tailored to Zimbabwe's academic structure, supporting ZJC (Forms 1–2), O Level (Forms 3–4), and A Level (Forms 5–6) programmes.

---

## Features

### Public Website
- Responsive homepage with school hero, stats, and news sections
- About, Admissions, Staff Gallery, Gallery, News & Contact pages
- Online student application form with document upload (birth certificate, result slip)
- Report card verification portal — anyone can verify a report card by its serial number

### Admin Portal
- **Dashboard** — Live stats: total students, teachers, fee collection, active users
- **User Management** — Create, edit, ban, reset passwords, and delete user accounts
- **Student Management** — Full student profiles with medical info, class assignment, and graduation tracking
- **Class Management** — Create and manage classes across all academic levels and forms
- **Subject Management** — Configure subjects per level with compulsory/optional flags
- **Grade Management** — View and oversee all grades across all classes
- **Fee Management** — Record payments, manage balances, issue receipts, track in USD & ZiG
- **Finance / Petty Cash** — Track school expenditure with categories and receipt images
- **Applications** — Review, approve or reject student enrollment applications
- **Announcements** — School-wide and class-targeted announcements
- **Access Codes** — Generate single-use or multi-use codes for teacher/admin registration
- **Academic Sessions** — Manage term dates with automatic session switching
- **Grading Scales** — Full CRUD for custom grade boundaries per academic level (ZJC / O Level / A Level): add, edit or delete ranges, grade letters and auto-comment descriptions used as default teacher comments
- **Homepage & Staff Gallery** — Manage public-facing news and staff profiles
- **Record Books** — Custom teacher record books with configurable columns
- **Scholarships** — Track full/partial scholarships with coverage percentages
- **Student Promotion** — Bulk promote or graduate students at year end
- **Backup & Restore** — Full database backup and restore via JSON export
- **Security Monitoring** — AI-assisted anomaly detection (rapid activity, bulk grade changes, after-hours access, banned user activity)
- **Messaging** — Admin-to-all messaging with real-time read receipts

### Teacher Portal
- **Dashboard** — Overview of assigned classes and recent activity
- **Classes** — View assigned classes and student rosters
- **Grade Entry** — Enter and edit term grades with automatic grade letter calculation; comments auto-fill from the admin-defined grading scale description when left blank
- **Monthly Tests** — Record and track monthly test scores separately from term grades
- **Attendance** — Mark daily attendance (present / absent / late / excused) with bulk marking
- **Rankings** — View class and subject-level student rankings
- **Report Cards** — Generate and download PDF report cards with signatures and QR verification codes
- **Announcements** — Create class-specific or school-wide announcements
- **Record Books** — Create custom spreadsheet-style record books
- **Messages** — Direct messaging with students, parents, and other staff
- **Study Pal (AI)** — Access the AI tutor for lesson preparation
- **Profile** — Update personal info, upload avatar and signature

### Student Portal
- **Dashboard** — Academic summary, recent grades, attendance stats, announcements
- **Grades** — View term grades and monthly test results across all subjects
- **Attendance** — View own attendance history with statistics
- **Report Cards** — View and download PDF report cards (when unlocked by admin)
- **Rankings** — View class and overall academic rankings
- **Fees** — View fee balance, payment history, and download receipts
- **Announcements** — School and class-specific announcements
- **Messages** — Direct messaging with teachers and classmates
- **Study Pal (AI)** — AI-powered tutor with image upload support for problem solving
- **Profile** — Update personal details and avatar

### Parent Portal
- **Dashboard** — Snapshot of all linked children's academic standing
- **Grades** — View grades for each linked child
- **Attendance** — View attendance records for each linked child
- **Fees** — Track fee payments and balances for each linked child
- **Reports** — View and download report cards for each linked child
- **Messages** — Direct messaging with teachers
- **Settings** — Link/unlink children by student ID, manage profile

### Authentication & Security
- Email/password login with role-based portal selection
- Student ID login (automatically resolves to email)
- Google OAuth sign-in
- Email OTP verification for student and parent registration
- Passkey / biometric authentication (WebAuthn)
- Account ban system with reason tracking
- Session management with auto-refresh
- Password reset via secure email link
- Activity logging for every significant user action

### AI Features
- **Study Pal** — Powered by Google Gemini, supports text and image input, streamed responses, markdown rendering, tailored to Zimbabwe's curriculum (ZJC, O Level, A Level)
- **Security Scan AI** — Analyses activity patterns to surface anomalies and suspicious behaviour

### WhatsApp Bot
- Conversational WhatsApp interface (via the `whatsapp-webhook` edge function) for students/parents
- On-demand report card generation: builds a fully styled PDF (header, subject table, average, position, signatures, QR verification) and sends it directly in chat
- Menu-driven flow with quick replies for grades, fees, attendance and announcements

### Notifications & Email
- Real-time in-app notification bell with unread count
- Automated transactional emails via Gmail SMTP:
  - Welcome / account activation
  - Password reset
  - Fee payment receipts
  - Attendance alerts (absent / late)
  - Grade notifications
  - Parent–student link confirmation
  - Results published notification

### Additional
- Dark / light mode toggle
- Fully responsive (mobile, tablet, desktop)
- Report card QR code verification
- Real-time messaging with online presence indicators and read receipts
- File/image uploads for avatars, receipts, signatures, staff photos

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Routing | React Router v6 |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF Generation | jsPDF + jspdf-autotable |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Edge Functions + Storage + Realtime) |
| Edge Functions Runtime | Deno (TypeScript) |
| Email | Gmail SMTP via denomailer |
| AI | Google Gemini |
| Hosting | Replit (dev) / any static host (prod) |

---

## Project Structure

```
├── src/
│   ├── App.tsx                  # Root with all route definitions
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles & Tailwind
│   ├── pages/
│   │   ├── Index.tsx            # Public homepage
│   │   ├── Login.tsx            # Multi-portal login
│   │   ├── Signup.tsx           # Role-based registration
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── Admissions.tsx       # Public application form
│   │   ├── VerifyReport.tsx     # Public report card verification
│   │   ├── admin/               # All admin portal pages
│   │   ├── teacher/             # All teacher portal pages
│   │   ├── student/             # All student portal pages
│   │   └── parent/              # All parent portal pages
│   ├── components/
│   │   ├── ui/                  # shadcn/ui base components
│   │   ├── DashboardLayout.tsx  # Shared sidebar layout
│   │   ├── Navbar.tsx           # Public site navbar
│   │   ├── ProtectedRoute.tsx   # Auth guard
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.tsx          # Auth context + role resolution
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client instance
│   │       └── types.ts         # Generated DB types
│   └── lib/
│       ├── passkey.ts           # WebAuthn / biometric utilities
│       └── utils.ts
├── supabase/
│   ├── config.toml
│   ├── functions/               # 12 Deno edge functions
│   └── migrations/              # 40 PostgreSQL migration files
├── public/
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [npm](https://npmjs.com) v9 or higher
- A [Supabase](https://supabase.com) account (free tier works)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) configured

---

### Local Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd stmarys-school-system

# 2. Install dependencies
npm install

# 3. Configure your environment variables (see below)

# 4. Start the development server
npm run dev
# App runs at http://localhost:5000
```

---

### Supabase Database Setup (from zero)

> ⚠️ This project uses **Supabase** (not Firebase). Follow these steps in order — they take you from a blank Supabase account to a fully working backend. The entire database is bundled in **one SQL file** so you do not need the Supabase CLI for the schema.

#### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (free tier is fine).
2. Click **New Project**.
3. Fill in:
   - **Name** — e.g. `stmarys`
   - **Database password** — pick a strong one and save it
   - **Region** — choose the one closest to your users
4. Click **Create new project** and wait ~2 minutes for it to finish provisioning.

#### Step 2 — Copy Your Project Credentials

1. Open your new project dashboard.
2. Go to **Project Settings** (gear icon, bottom-left) → **API**.
3. Copy and save these three values somewhere safe — you will paste them in later steps:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **Project API keys → anon / public** — long JWT string
   - **Project API keys → service_role** — keep this **secret**, never put it on the frontend

#### Step 3 — Run the Database Schema (1 single SQL file)

You don't need the Supabase CLI for this step. Everything — tables, enums, RLS policies, triggers, functions, indexes and seed data — is bundled in **one** SQL file: [`supabase/setup/full-schema.sql`](supabase/setup/full-schema.sql).

1. In your Supabase dashboard, open the **SQL Editor** (left sidebar).
2. Click **+ New query**.
3. Open `supabase/setup/full-schema.sql` from this repo and copy **everything** inside it.
4. Paste it into the SQL Editor.
5. Click **Run** (bottom-right) — wait ~30 seconds for it to finish.

If you ever need to re-run it on an existing database, the file is idempotent — it uses `CREATE ... IF NOT EXISTS` and re-seeds the `ADMIN2026` access code safely.

This single command creates:
- All 40+ tables (profiles, students, grades, fees, messages, …)
- All enums (academic_level, app_role, …)
- All Row Level Security policies (so data is protected per role)
- All triggers (auto-generate student IDs, send notifications, …)
- All database functions (`has_role`, `calculate_grade`, …)
- All seed data (default subjects, grading scales, the `ADMIN2026` access code)

> If you ever need to run individual migrations instead, they live in `supabase/migrations/` and run in alphabetical order.

#### Step 4 — Create Storage Buckets

In your dashboard, open **Storage** (left sidebar) and click **New bucket** for each one below. **Make every one Public.**

| Bucket name | Purpose |
|---|---|
| `avatars` | User profile photos |
| `receipts` | Fee payment proof images |
| `chat-attachments` | Messaging file attachments |
| `staff-photos` | Staff gallery images |
| `homepage-images` | Public homepage images |
| `signatures` | Teacher/admin report card signatures |
| `application-documents` | Student enrollment application docs |

#### Step 5 — Enable Realtime on the right tables

1. Open **Database** → **Replication** in your dashboard.
2. Click **0 tables** (or the existing count) next to `supabase_realtime`.
3. Toggle ON for these tables:
   - `messages`
   - `message_reads`
   - `user_presence`
   - `notifications`

#### Step 6 — Get a Gmail App Password

The system sends transactional emails (welcome, password reset, fee receipts, attendance alerts, …) through Gmail SMTP.

1. Go to your Google Account → enable **2-Step Verification** if not already on.
2. Visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Create an app password named "St Mary's" → Google gives you a 16-character code (no spaces).
4. Save the Gmail address + the 16-char code for the next step.

#### Step 7 — Add Edge Function Secrets

In your Supabase dashboard go to **Project Settings** → **Edge Functions** → **Secrets** (or **Edge Functions** → **Manage secrets**) and add:

| Secret Key | Required? | Value |
|---|---|---|
| `GMAIL_EMAIL` | Yes | Your Gmail address from Step 6 |
| `GMAIL_APP_PASSWORD` | Yes | The 16-character Gmail app password from Step 6 |
| `LOVABLE_API_KEY` | Yes | AI gateway key (powers Study Pal & Security Scan AI) |
| `RESEND_API_KEY` | Optional | Resend API key (alternative branded email provider) |
| `RESEND_FROM_EMAIL` | Optional | Verified Resend sender, e.g. `noreply@yourdomain.com` |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp bot only | Meta Cloud API permanent access token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp bot only | The numeric phone-number ID from Meta WhatsApp setup |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp bot only | Any random string — Meta uses it to verify the webhook |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` and the JWT/publishable key set are injected automatically by Supabase — do **not** add them manually.

#### Step 8 — Enable Google OAuth (optional, for Google Sign-In)

1. Go to **Authentication → Providers → Google** and toggle it ON.
2. Add your Google OAuth client ID + secret (get them from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)).
3. Open **Authentication → URL Configuration** and add your site URL (e.g. `http://localhost:5000` for dev, `https://yourdomain.com` for production) to:
   - **Site URL**
   - **Redirect URLs**

---

### Environment Variables

Create a `.env` file in the project root with the values you copied in Step 2:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_PUBLIC_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

> These are public/anon keys — safe to expose because Row Level Security protects everything.

After saving `.env`, restart your dev server (`Ctrl+C` then `npm run dev`).

---

### Deploy Edge Functions

The project ships with **16 edge functions** in `supabase/functions/`. They handle admin user creation, password resets, AI streaming, email sending, backups, the WhatsApp bot and more.

#### Option A — Deploy all at once (recommended)

```bash
# 1. Install the Supabase CLI (one time)
npm install -g supabase

# 2. Log in (opens a browser)
supabase login

# 3. Link this folder to your Supabase project
#    (project ref = the xxxxxxxx in your Supabase URL)
supabase link --project-ref YOUR_PROJECT_ID

# 4. Deploy every function in one shot
supabase functions deploy
```

#### Option B — Deploy them individually

```bash
supabase functions deploy admin-create-account
supabase functions deploy admin-delete-user
supabase functions deploy admin-reset-password
supabase functions deploy auto-session
supabase functions deploy backup-restore
supabase functions deploy complete-signup
supabase functions deploy passkey-auth
supabase functions deploy promote-students
supabase functions deploy reset-password-otp
supabase functions deploy security-scan
supabase functions deploy send-branded-email
supabase functions deploy send-notification
supabase functions deploy send-whatsapp-otp
supabase functions deploy study-pal
supabase functions deploy verify-otp
supabase functions deploy whatsapp-webhook
```

#### Option C — Create a brand new edge function from scratch

If you ever want to add your own function (e.g. `my-function`):

```bash
# 1. Scaffold it
supabase functions new my-function

# 2. Edit the generated file at:
#    supabase/functions/my-function/index.ts

# 3. (Optional) test it locally
supabase functions serve my-function

# 4. Deploy it
supabase functions deploy my-function
```

Then call it from the frontend like this:

```ts
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("my-function", {
  body: { hello: "world" },
});
```

> Make sure the function returns proper CORS headers, otherwise the browser will block it. Look at any existing function in `supabase/functions/` for a working CORS template.

---

### WhatsApp Bot Setup

The `whatsapp-webhook` edge function powers a conversational WhatsApp bot for students and parents — they can request grades, fees, attendance, announcements and an on-the-fly PDF report card straight from chat.

#### Step 1 — Create a Meta WhatsApp Business app

1. Go to [https://developers.facebook.com](https://developers.facebook.com) and create a new app (type: **Business**).
2. In the app dashboard, add the **WhatsApp** product.
3. Under **WhatsApp → API Setup**, copy the **Phone number ID** and generate a **Temporary access token** (for testing). For production, create a **System User** in Business Settings and issue a **permanent access token** with `whatsapp_business_messaging` and `whatsapp_business_management` scopes.

#### Step 2 — Add the secrets

In Supabase **Project Settings → Edge Functions → Secrets** add:

| Secret | Where to get it |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Permanent access token from Step 1 |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from Step 1 |
| `WHATSAPP_VERIFY_TOKEN` | Any random string you make up (e.g. `stmarys-verify-123`) |

#### Step 3 — Deploy the webhook

```bash
supabase functions deploy whatsapp-webhook
```

Your webhook URL will be:

```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/whatsapp-webhook
```

#### Step 4 — Configure the webhook in Meta

1. In Meta dashboard go to **WhatsApp → Configuration → Webhook**.
2. Click **Edit** and paste:
   - **Callback URL** — the URL from Step 3
   - **Verify token** — the same string you put in `WHATSAPP_VERIFY_TOKEN`
3. Click **Verify and Save**.
4. Under **Webhook fields**, subscribe to **messages**.

#### Step 5 — Test

From the **API Setup** page in Meta, send a test message to your own WhatsApp number, then reply `menu` to the bot. You should get the interactive menu back.

> Outbound messages to numbers other than the registered test number require Meta business verification.

---

### First Admin Account

Once everything is set up:

1. Navigate to `/signup` on your running app.
2. Select the **Administrator** portal.
3. Use access code: `ADMIN2026`
4. Complete registration.

You now have full admin access. From the admin panel you can generate access codes for teachers and manage student enrollment.

---

## User Roles

| Role | How to Register | Access |
|---|---|---|
| **Admin** | Signup with admin access code | Full system access |
| **Teacher** | Signup with teacher access code (generated by admin) | Classes, grades, attendance, messaging |
| **Student** | Apply via Admissions page, approved by admin | Own academic data, Study Pal, messaging |
| **Parent** | Self-signup, then link children by student ID | Children's grades, attendance, fees, reports |

---

## Database Schema

The database is built on PostgreSQL with Row Level Security enforced on every table.

| Table | Purpose |
|---|---|
| `profiles` | User display name, email, avatar, ban status |
| `user_roles` | Role assignments (admin / teacher / student / parent) |
| `access_codes` | One-time or multi-use registration codes |
| `classes` | Class definitions (name, form, level, stream) |
| `subjects` | Subject catalogue per level |
| `student_profiles` | Extended student data (class, form, level, medical info) |
| `teacher_profiles` | Extended teacher data (department, qualifications) |
| `teacher_assignments` | Teacher ↔ Subject ↔ Class assignments |
| `grades` | Term grade entries |
| `monthly_tests` | Monthly test scores |
| `attendance` | Daily attendance records |
| `fee_records` | Fee obligations per student per term |
| `fee_payments` | Individual payment transactions |
| `petty_cash` | School expenditure records |
| `scholarships` | Scholarship tracking |
| `announcements` | School-wide and class announcements |
| `academic_sessions` | Term date ranges |
| `grading_scales` | Grade boundary config per academic level |
| `applications` | Student enrollment applications |
| `conversations` | Messaging thread containers |
| `conversation_participants` | Conversation membership |
| `messages` | Individual messages |
| `message_reads` | Read receipt tracking |
| `user_presence` | Online/offline status |
| `notifications` | In-app notification records |
| `passkey_credentials` | WebAuthn credential storage |
| `parent_student_links` | Parent ↔ student relationships |
| `homepage_updates` | Public homepage news items |
| `staff_gallery` | Public staff directory |
| `record_books` | Custom teacher record books |
| `record_book_columns` | Column definitions |
| `record_book_entries` | Cell values |
| `report_verifications` | QR-verifiable report card records |
| `report_signatures` | Signature image URLs |
| `security_alerts` | Flagged suspicious activity |
| `system_settings` | Key-value config store |
| `activity_log` | Full audit log of all user actions |

---

## Edge Functions

| Function | Purpose |
|---|---|
| `admin-create-account` | Creates teacher/student accounts with role assignment and sends welcome email |
| `admin-delete-user` | Deletes users and all associated data from auth and database |
| `admin-reset-password` | Admin-initiated password reset for any user |
| `auto-session` | Automatically switches the active academic term based on today's date |
| `backup-restore` | Full database export to JSON and restore from JSON backup |
| `passkey-auth` | Registers and authenticates WebAuthn/biometric passkey credentials |
| `promote-students` | Bulk promotes students to the next form/level or graduates final-year students |
| `security-scan` | Rule-based + AI anomaly detection across activity logs, grades, and fees |
| `send-branded-email` | Sends all school-branded transactional emails via Gmail SMTP |
| `send-notification` | Application status notification emails (approved / rejected / received) |
| `study-pal` | Streams AI tutor responses from Google Gemini |
| `verify-otp` | Validates email OTP codes for student and parent registration |
| `complete-signup` | Finalises pending signups after OTP / access-code validation |
| `reset-password-otp` | OTP-based password reset flow for users without email access |
| `send-whatsapp-otp` | Sends one-time codes over WhatsApp via the Meta Cloud API |
| `whatsapp-webhook` | WhatsApp Cloud API webhook — powers the conversational bot (menu, grades, fees, attendance, PDF report cards) |

---

## Credits

### Creator

**Darrell Mucheri**
Upper 6 student at St. Mary's High School, pursuing Mathematics, Physics & Chemistry at A Level.

- GitHub: [@mrfr8nk](https://github.com/mrfr8nk)
- Email: [darrelmucheri@gmail.com](mailto:darrelmucheri@gmail.com)
- WhatsApp: +263 719 647 303

> This entire system was designed and built from scratch by Darrell in 2025 — as a student, for the school he attends.

---

### School Leadership

**St. Mary's High School** — *Excellence & Integrity* — Est. 1962

| Role | Name |
|---|---|
| Headmaster | Mr. Nyabako |
| Deputy Headmaster | Mr. Gocha |
| Senior Teacher | Mr. Tapera |
| Senior Lady | Mrs. Chiweshe |
| Head Boy | Denzel |
| Head Girl | Carol |
| Senior Prefect | Darrell Mucheri |

---

### Open Source Libraries

This project is built on the shoulders of these excellent open-source projects:

| Library | License |
|---|---|
| [React](https://react.dev) | MIT |
| [Vite](https://vitejs.dev) | MIT |
| [TypeScript](https://typescriptlang.org) | Apache 2.0 |
| [Tailwind CSS](https://tailwindcss.com) | MIT |
| [shadcn/ui](https://ui.shadcn.com) | MIT |
| [TanStack Query](https://tanstack.com/query) | MIT |
| [React Router](https://reactrouter.com) | MIT |
| [React Hook Form](https://react-hook-form.com) | MIT |
| [Zod](https://zod.dev) | MIT |
| [Recharts](https://recharts.org) | MIT |
| [jsPDF](https://github.com/parallax/jsPDF) | MIT |
| [Lucide Icons](https://lucide.dev) | ISC |
| [Supabase JS](https://github.com/supabase/supabase-js) | MIT |
| [date-fns](https://date-fns.org) | MIT |
| [Radix UI](https://www.radix-ui.com) | MIT |
| [next-themes](https://github.com/pacocoursey/next-themes) | MIT |
| [react-markdown](https://github.com/remarkjs/react-markdown) | MIT |
| [Sonner](https://sonner.emilkowal.ski) | MIT |
| [Embla Carousel](https://embla-carousel.com) | MIT |
| [denomailer](https://deno.land/x/denomailer) | MIT |

---

## Deploying to Vercel / Render / Netlify (SPA rewrite rules)

This is a Vite + React SPA using client-side routing (React Router). The server only has `index.html` on disk — paths like `/admin/students`, `/student/grades`, `/verify/...` exist **only inside React Router**.

**Why you get 404 on refresh:** When you load `/` then click into `/admin/students`, React Router handles it in the browser. But if you **refresh** that page (or share/open the URL directly), the browser asks the host for the file at `/admin/students`. There is no such file, so the host returns **404**.

**The fix:** Tell the host "for any unknown path, serve `index.html` and let the SPA handle routing." This is called a *catch-all rewrite* (a rewrite, NOT a redirect — the URL must stay the same so React Router can read it).

The repo already ships with the right config files for all major hosts. Just deploy and make sure the file is present.

---

### ✅ Vercel

File: **`vercel.json`** (already in repo root)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Project settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

After deploying, hard-refresh on a deep link (e.g. `/login`) — you should see the page, not a 404.

> ⚠️ If you still get 404s on Vercel: open **Project → Settings → Build & Deployment** and confirm `vercel.json` is at the **root** of the repo (not inside `src/` or `public/`). Then redeploy.

---

### ✅ Netlify / Cloudflare Pages

File: **`public/_redirects`** (already included — Vite copies it to `dist/` on build)
```
/*    /index.html   200
```
Project settings:
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

The trailing `200` is critical — that makes it a **rewrite** (URL stays the same), not a `301`/`302` redirect.

---

### ✅ Render (Static Site)

Render does **not** read `_redirects` or `vercel.json` — you must add the rule in the dashboard:

1. **New +** → **Static Site** → connect your repo
2. **Build Command:** `npm run build`
3. **Publish Directory:** `dist`
4. After the first deploy, open the service → **Redirects/Rewrites** tab → **Add Rule**:
   - **Source path:** `/*`
   - **Destination path:** `/index.html`
   - **Action:** **Rewrite** ← MUST be Rewrite, not Redirect
5. **Save Changes** → trigger a manual deploy

> If you pick **Redirect** instead of Rewrite, the URL will visibly change to `/index.html` and React Router will land on `/`. Always pick **Rewrite**.

---

### ✅ GitHub Pages / Apache / Nginx (less common)

- **GitHub Pages:** add a `public/404.html` that is a copy of `index.html` (Pages serves `404.html` for unknown paths).
- **Nginx:** in your `server { }` block:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- **Apache:** add a `public/.htaccess`:
  ```apache
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```

---

### Verifying the rewrite works

After deploying:
1. Visit your live site at `/`
2. Click into a deep route (e.g. `/login` or `/admin/students`)
3. Press **Ctrl/Cmd + Shift + R** (hard refresh)
4. ✅ Page reloads correctly = rewrite is working
5. ❌ 404 page = rewrite is missing or set to **Redirect** instead of **Rewrite**

Also test by **pasting a deep URL directly into a new tab** — same expected behavior.

---

### Environment variables (all hosts)

Set these in the host's dashboard before the first deploy:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Without these, the build succeeds but the deployed app cannot talk to the backend.



---

## Troubleshooting: `duplicate key value violates unique constraint "buckets_pkey"`

This happens when re-running `full-schema.sql` against a database that already has the storage buckets created (e.g. `avatars`, `staff-photos`, `homepage-images`). The bucket inserts have been made **idempotent** with `ON CONFLICT (id) DO NOTHING`, so a fresh pull of `supabase/setup/full-schema.sql` will run cleanly.

If you still hit it (older copy of the SQL), either:

**Option A — patch the offending lines** in `full-schema.sql`:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```
Do the same for `staff-photos` and `homepage-images`.

**Option B — drop the existing buckets first** (only safe on a dev/empty project — this deletes uploaded files):
```sql
DELETE FROM storage.objects WHERE bucket_id IN ('avatars','staff-photos','homepage-images');
DELETE FROM storage.buckets WHERE id IN ('avatars','staff-photos','homepage-images');
```
Then re-run the schema.

**Option C — skip just the bucket block** and re-run the rest. The buckets already exist, so nothing else is needed.

---

## Troubleshooting: `trigger "on_auth_user_created" for relation "users" already exists`

This happens when re-running `full-schema.sql` against a database that already has triggers created. All `CREATE TRIGGER` statements in `full-schema.sql` have been made **idempotent** with `DROP TRIGGER IF EXISTS ...` guards, so a fresh pull will run cleanly.

If you still hit it (older copy of the SQL), either:

**Option A — drop the trigger manually** then re-run:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

**Option B — drop all existing triggers before running the full schema** (safe on dev/empty projects):
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_teacher_profiles_updated_at ON public.teacher_profiles;
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON public.student_profiles;
DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
DROP TRIGGER IF EXISTS trg_generate_student_id ON public.student_profiles;
DROP TRIGGER IF EXISTS on_application_insert ON public.applications;
DROP TRIGGER IF EXISTS on_fee_payment_insert ON public.fee_payments;
DROP TRIGGER IF EXISTS on_profile_insert ON public.profiles;
```
Then re-run the schema.

**Option C — pull the latest `full-schema.sql`** which now includes `DROP TRIGGER IF EXISTS` before every `CREATE TRIGGER`.



<div align="center">

Built with dedication by **Darrell Mucheri** for **St. Mary's High School** · Zimbabwe · 2025

</div>

---

## Deploy to Render (Static Site)

The frontend is a Vite SPA, so it deploys cleanly as a Render **Static Site**. The Supabase backend (database, auth, edge functions, storage) stays on Lovable Cloud / Supabase — Render only hosts the built frontend.

### 1. Push the repo to GitHub / GitLab / Bitbucket

Render deploys from a Git provider. Make sure your latest code is pushed.

### 2. Create the Static Site on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New +** → **Static Site**.
2. Connect your Git provider and pick this repository.
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `st-marys-school` (or anything you like) |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Node Version** | `20` (set via env var `NODE_VERSION=20`) |

> There is no "start command" on a static site — Render serves the files in `dist/` over its CDN.

### 3. Add environment variables

In the Render dashboard for the site → **Environment** → **Add Environment Variable**:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your Supabase anon / publishable key |
| `VITE_SUPABASE_PROJECT_ID` | your Supabase project ref |
| `NODE_VERSION` | `20` |

These must be set **before** the first build — Vite inlines `VITE_*` vars at build time.

### 4. Add the SPA rewrite rule (fixes 404 on refresh)

React Router uses client-side routing, so deep links like `/admin` must fall back to `index.html`.

In the Render dashboard → your site → **Redirects/Rewrites** → **Add Rule**:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | Rewrite |

### 5. Deploy

Click **Create Static Site**. Render will:

1. Run `npm install && npm run build`
2. Publish the contents of `dist/`
3. Give you a URL like `https://st-marys-school.onrender.com`

Every push to `main` triggers an automatic redeploy.

### Quick reference — scripts used

From `package.json`:

```bash
# Install
npm install

# Build for production (Render runs this)
npm run build

# Preview the production build locally
npm run preview

# Local dev (not used by Render)
npm run dev
```

### Custom domain (optional)

Render → site → **Settings** → **Custom Domains** → add your domain and update DNS as instructed (CNAME to the Render URL).

</div>
