# LectureWeave — Frontend UI/UX Redesign Map

This document is the design map for the frontend transformation. It records the
audit baseline, the target route map, the design-token system, the shared
component inventory, the animation plan, and the risks — so the redesign stays a
**presentation-only** change over unchanged application logic.

> Guiding rule: the current screens are the **functional baseline**, not the
> visual target. No backend, API-contract, or database changes. No fabricated
> data — only fields the backend actually returns are ever displayed.

---

## 1. Route inventory (before)

Routing lived inline in `src/App.jsx`. `/` was the protected dashboard;
`PublicRoute` bounced authenticated users back to `/`.

| Path | Component | Access |
| --- | --- | --- |
| `/login` | `Login` | public-only |
| `/signup` | `Signup` | public-only |
| `/` | `Dashboard_Professional` | protected |
| `/subjects` | `SubjectsManagement` | protected |
| `/subjects/new` | `SubjectsManagement` | protected |
| `/subjects/:subjectId/setup` | `LectureSetup` | protected |
| `/subjects/:subjectId/lecture` | `LiveLecture_New` | protected |
| `/subjects/:subjectId/chat` | `SubjectChatPage` | protected |
| `/subjects/:subjectId/flashcards` | `FlashcardsPage` | protected |
| `/subjects/:subjectId/quizzes` | `QuizPage` | protected |
| `/my-notes` | `MyNotes` | protected |
| `/lecture/:lectureId` (+ `/notes/:id` alias) | `NotesViewer` | protected |

## 2. Route map (after)

Public landing page takes `/`; the authenticated dashboard moves to `/app`.
`/dashboard` redirects to `/app`. All existing deep links are preserved.

| Path | Layout | Component | Access |
| --- | --- | --- | --- |
| `/` | `MarketingLayout` | `LandingPage` | public |
| `/login` | `AuthLayout` | `Login` | public-only → `/app` |
| `/signup` | `AuthLayout` | `Signup` | public-only → `/app` |
| `/app` | `AppLayout` | `Dashboard` | protected |
| `/dashboard` | — | `Navigate → /app` | — |
| `/subjects`, `/subjects/new` | `AppLayout` | `SubjectsManagement` | protected |
| `/subjects/:id/setup` | `AppLayout` | `LectureSetup` | protected |
| `/subjects/:id/lecture` | `FocusLayout` | `LiveLecture_New` | protected |
| `/subjects/:id/chat` | `AppLayout` | `SubjectChatPage` | protected |
| `/subjects/:id/flashcards` | `AppLayout` | `FlashcardsPage` | protected |
| `/subjects/:id/quizzes` | `AppLayout` | `QuizPage` | protected |
| `/my-notes` | `AppLayout` | `MyNotes` | protected |
| `/lecture/:lectureId` (+ `/notes/:id`) | `AppLayout` | `NotesViewer` | protected |

**CTA logic:** unauthenticated `Get started` → `/signup`, `Log in` → `/login`;
authenticated users see `Open app` → `/app`.

## 3. Shared infrastructure to REUSE (never replaced)

| Module | Public API used by the UI |
| --- | --- |
| `src/api/httpClient.js` | default axios instance (JWT interceptor, FormData handling); `TOKEN_STORAGE_KEY`, `USER_STORAGE_KEY` |
| `src/api/websocketClient.js` | `createLectureSocket(lectureId)` |
| `src/config/environment.js` | `environment.{API_BASE_URL, WS_BASE_URL, APP_NAME}` |
| `src/contexts/AuthContext.jsx` | `useAuth()` → `{user, loading, isAuthenticated, login, register, logout}` |
| `src/lib/utils.js` | `cn`, `formatDuration`, `formatFileSize`, `generateId` |
| `src/components/MarkdownView.jsx` | `MarkdownView`, `sanitizeMarkdown` |
| `src/features/citations/CitationMarkdown.jsx` | citation-aware markdown |
| `src/api/endpoints/*` | every network call funnels through here |

## 4. Real data contract (no fabrication)

- **Dashboard** `GET /api/dashboard/stats` → `{subject_count, lecture_count,
  notes_count, documents_count, recent_lectures[]}`; each recent lecture:
  `{_id, title, created_at, status}`.
- **Subjects** `{_id, name, code, description?, lecture_count?}`.
- **Notes** `{_id, title, lecture_title, created_at, markdown, key_takeaways[]}`.
- **Lecture notes** `{title, created_at, updated_at, duration, status,
  final_notes{title, markdown, citations[]}, structured_notes[]}`.

Anything not in these shapes is not shown. (The old dashboard defaulted an
absent `status` to the literal `"Completed"` and hid the returned
`notes_count`/`documents_count`; the redesign shows the real counts and drops
the fabricated status default.)

## 5. Design tokens

Defined as CSS variables in `src/styles/tokens.css` and mapped into Tailwind.

**App (light) surface**
`--background #F7F8FC`, `--surface #FFFFFF`, `--surface-subtle #F1F3F9`,
`--text-primary #111827`, `--text-secondary #64748B`, `--border #E2E8F0`.

**Brand / accent**
`--primary #5B5CE2`, `--primary-dark #4344C8`, `--primary-soft #ECECFF`,
`--accent-cyan #22D3EE`, `--accent-violet #8B5CF6`.

**Semantic**
`--success #16A34A`, `--warning #F59E0B`, `--danger #EF4444`, plus
`ready/recording/uploading/transcribing/retrieving/generating/complete/failed/
retrying/disconnected` status colours.

**Marketing (dark)**
`--marketing-background #090B16`, `--marketing-surface #111528`,
`--marketing-text #F8FAFC`.

**Shape / type**: card radius 16–20px, button 10–14px, input 10–12px; font
`Manrope` (self-hosted) with system fallback; controlled shadows + focus ring.

## 6. Shared component inventory

- **`components/ui/`**: `Button, Card, Badge, Input, Select, Textarea, Modal,
  Drawer, Dropdown, Tooltip, Tabs, Progress, Skeleton, EmptyState, ErrorState,
  ConfirmDialog, StatusPill` (+ a `toast` helper over the existing single
  `react-hot-toast` Toaster).
- **`components/motion/`**: `FadeIn, StaggerGroup, PageTransition, AnimatedNumber`.
- **`components/brand/`**: `Logo, Wordmark`.
- **`components/navigation/`**: `MarketingNavbar, AppSidebar, AppTopbar,
  MobileNavigation, UserMenu, Breadcrumbs`.
- **`layouts/`**: `MarketingLayout, AppLayout, FocusLayout, AuthLayout`.

Existing feature components (`features/{citations,documents,recording,
transcripts,markers,notes,subject-chat,flashcards,quizzes,topics}`) are reused
as-is; only their surrounding page chrome is redesigned in later phases.

## 7. Page-by-page redesign map

| Page | Change | Phase |
| --- | --- | --- |
| `LandingPage` (new) | full public marketing page | UI-3 |
| `Login`, `Signup` | into `AuthLayout`, keep auth logic | UI-3 |
| `Dashboard` | real metrics, current activity, quick actions, empty state | UI-4 |
| `SubjectsManagement` | differentiated cards, overflow menu, `ConfirmDialog` | UI-4 |
| `LectureSetup` | 3-step stepper, polished dropzone, real stage timeline | UI-4 |
| `MyNotes` | responsive cards, real metadata only, drop embedded logout | UI-4 |
| `LiveLecture_New` | re-skin in place (no logic change) — session bar, waveform, transcript timeline, marker toolbar, notes tabs | UI-5 |
| `NotesViewer` | reading layout + topic nav + citation drawer | UI-6 |
| chat / flashcards / quizzes | polished shells over existing feature components | UI-6 |

## 8. Animation plan

Framer Motion, transform/opacity only, 120–450ms, all gated behind
`useReducedMotion` (reduced motion → simple fade, no infinite/decorative/parallax
motion). Inventory: navbar scroll transition; hero stagger;
`AnimatedKnowledgeField` (gradient drift + connecting-line draw + node float +
pointer parallax, disabled on touch/reduced-motion); product-visual assembly;
scroll-reveal sections; CTA hover; sidebar collapse; per-route fade/slide
(non-live pages only); auth panel entrance; card stagger on load.

## 9. Live-recording safeguards (mandatory)

- Live route uses `FocusLayout` rendering `LiveLecture_New` as a **stable,
  un-keyed, un-animated** child. No `AnimatePresence`/`PageTransition` wraps it.
- No `key` derived from route/layout/theme state on the recorder subtree.
- WebSocket effect, recorder refs, and timer are untouched; the
  `location.state` contract (`{lectureId, lectureTitle, subjectName, template}`)
  is preserved.
- No fabricated progress %, no fake Pause control.

## 10. Baseline metrics (pre-redesign)

- `npm run lint` clean; `npm run test` green; `npm run build` passes.
- Single JS chunk **764.90 kB (gzip 232.79 kB)**, CSS 64.41 kB (gzip 14.36 kB).
  Route/feature code-splitting is scheduled for UI-7 to break this up.

## 11. Dependencies

No new runtime dependencies. All required libraries already present:
`framer-motion@10`, `lucide-react`, `react-hot-toast`, `clsx`, `tailwind-merge`,
`react-dropzone`, `react-router-dom@6`.

---

## Delivery status

- [x] UI-0 — audit + this map
- [ ] UI-1 — tokens, primitives, motion
- [ ] UI-2 — routing + layouts + navigation
- [ ] UI-3 — landing + auth  → **review checkpoint**
- [ ] UI-4 — dashboard, subjects, setup, notes list
- [ ] UI-5 — live lecture (isolated, high-risk)
- [ ] UI-6 — notes viewer, chat, flashcards, quizzes
- [ ] UI-7 — polish, a11y, bundle, tests
