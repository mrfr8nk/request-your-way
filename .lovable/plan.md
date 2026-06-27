# St. Mary's — Editorial Redesign (Greenhill × Juniper Blend)

Google OAuth is already fixed in this turn (managed `lovable.auth` helper, Continue with Google as the top CTA on Login, available for every role on the per-portal form too). The rest of the work is the visual redesign.

This is large — ~100+ pages. I'll roll it out in 4 phases so you can review and steer between each. Each phase ends with a working, deployable site.

## Visual Direction (locked across all phases)

**Aesthetic blend**
- Structure & typography → Greenhill: full-bleed campus photography, Playfair Display italic accent words inside otherwise restrained roman headlines, generous whitespace, calm pacing.
- Depth & motion → Juniper: deeper navy gradients, tilted layered card collages on feature sections, gold sheen accents, more confident hover states.

**Design tokens (added to `index.css`, no hardcoded colors anywhere)**
- Keep current `--primary` navy `212 100% 20%` and `--secondary` gold `47 100% 50%`.
- Add `--ink: 215 35% 12%` (editorial body), `--paper: 38 30% 97%` (warm off-white), `--rule: 215 20% 88%` (hairline dividers), `--overlay-deep: 215 60% 8% / 0.62` (Greenhill image overlay).
- New gradients: `--gradient-editorial` (paper → subtle navy tint), `--gradient-juniper-depth` (deep navy → indigo for feature bands).
- New shadows: `--shadow-editorial` (soft, very long), `--shadow-tilt-card` (for the layered collage).

**Typography**
- Display: Playfair Display (already in use). Establish a `.headline-editorial` utility — roman + selective italic span, tracking `-0.02em`, leading `0.95`.
- Body: Source Sans 3 (kept). New `.eyebrow` utility: 11px uppercase, letter-spacing `0.3em`, gold.
- Italic accent word treatment everywhere a headline appears.

**Motion system (one cohesive language)**
- `framer-motion` driven. Adopt a single easing curve `[0.22, 1, 0.36, 1]` and three durations: 240ms (micro), 520ms (block reveal), 1100ms (hero Ken Burns).
- Standard primitives: `<Reveal>` (fade+rise 18px), `<KenBurns>` (slow 1.06× scale on hero images), `<Tilt>` (3° perspective on collage cards), `<Marquee>` (slow logo/stat band).
- `prefers-reduced-motion` honored everywhere.

## Phase 1 — Public Site Core (1 round)

1. Install `framer-motion`. Create `src/components/motion/` primitives (`Reveal`, `KenBurns`, `Tilt`, `SectionEyebrow`, `EditorialHeading`).
2. Add new design tokens to `index.css` and `tailwind.config.ts`.
3. Rebuild `HeroSection.tsx`: full-bleed campus photo with Ken Burns, Greenhill-style centered editorial headline ("An education for *life*"), gold eyebrow pill, two CTAs, scroll affordance. Keep the 3 stat tiles but redesigned as a Juniper-style tilted layered band at the bottom.
4. Rebuild `Navbar.tsx`: glass header on scroll, thin hairline divider, serif wordmark, refined hover underline, prominent gold "Apply" pill.
5. Rebuild `AboutSection`, `AcademicsSection`, `HeadmasterSection`, `NewsSection`, `GallerySection`, `CTASection`, `Footer` to share the same eyebrow + editorial heading + reveal-on-scroll rhythm. Gallery becomes a Juniper-style tilted collage; Academics becomes a horizontal Greenhill-style scroll-snap card row.

## Phase 2 — Public Sub-pages + Auth Pages (1 round)

1. About, Academics, Admissions, Gallery, Staff, News, Contact, Credits — apply the editorial template (eyebrow / headline / lead paragraph / content / CTA band).
2. **Login + Signup**: editorial split-screen. Left = full-bleed campus photo with serif italic quote overlay; right = card with auth form. Continue with Google is already top CTA — keep it but restyle with the new tokens.
3. ForgotPassword / ResetPassword / VerifyReport / NotFound — same split-screen shell.

## Phase 3 — Portal Shell + Shared Pages (1 round)

1. Rebuild `DashboardLayout.tsx` chrome: thin navy sidebar with serif section labels, glass top bar, refined breadcrumb, subtle Juniper gradient on the active item, smooth collapse animation. Sidebar mini-collapse honored (per shadcn sidebar guidance).
2. Apply the editorial card style (paper bg, hairline border, soft long shadow) to all shared components: `Card` variants, `Table`, `Tabs`, stat tiles, empty states.
3. Shared pages (Messages, Library, Events, Behavior, Rankings, Timetable, VerifyDocuments) get the new headers + motion.

## Phase 4 — Per-role Portal Pages (1–2 rounds)

1. Admin dashboards (20 pages) — restyle headers, KPI tiles as tilted collage on the main dashboard, refined data tables, motion on tab/page transitions.
2. Teacher dashboards (12 pages) — same treatment.
3. Student dashboards (10 pages).
4. Parent dashboards (7 pages).
5. Final polish pass: page-transition fade on route change, loading skeletons restyled to match the editorial palette, toast restyling.

## What stays untouched

- Business logic, RPCs, RLS, edge functions, data fetching.
- `src/integrations/supabase/*` and `src/integrations/lovable/*` (auto-generated).
- Existing security model from the prior security pass.

## After you approve

I'll start with Phase 1 in the next turn — install framer-motion, add tokens, ship the motion primitives, rebuild Hero + Navbar + the home sections. Each subsequent phase is one more turn with a screenshot review.
