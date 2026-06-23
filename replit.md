# St. Mary's High School Management System

## Overview
A comprehensive school management system built with React + Vite + TypeScript, using Supabase as the backend (auth, database, edge functions). This is a frontend-only application — all backend logic runs through Supabase.

## Architecture
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime)
- **State**: TanStack Query for data fetching, React Context for auth
- **Routing**: React Router v6

## Project Structure
```
src/
  App.tsx              - Root component with all route definitions
  main.tsx             - Entry point
  pages/               - Page components organized by role
    Index.tsx          - Public homepage
    Login.tsx          - Multi-portal login
    Signup.tsx         - Role-based registration
    admin/             - Admin portal pages
    teacher/           - Teacher portal pages
    student/           - Student portal pages
    parent/            - Parent portal pages
  components/          - Reusable UI components
  hooks/               - Custom React hooks (useAuth, etc.)
  integrations/
    supabase/          - Supabase client and generated types
  lib/                 - Utilities (passkey auth, etc.)
supabase/
  functions/           - Supabase Edge Functions (Deno)
  migrations/          - PostgreSQL migration files
```

## Roles
- **Admin**: Full system management
- **Teacher**: Grade entry, attendance, class management
- **Student**: View grades, attendance, fees, reports
- **Parent**: Monitor linked children's progress

## Environment Variables
Set in Replit's environment secrets/vars:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

## Development
- Run: `npm run dev` (starts on port 5000)
- Build: `npm run build`

## Supabase Project
- Project ID: `vojhptlreurutrzftatn`
- All DB schema changes are in `supabase/migrations/`
- Edge Functions are in `supabase/functions/`

## Key Features
- Multi-role authentication (admin/teacher/student/parent)
- Passkey/biometric login support
- Academic grade management with report cards
- Attendance tracking
- Fee management with receipts
- Real-time messaging between users
- AI study assistant (Study Pal)
- Security monitoring and alerts
- Parent portal with linked student access
