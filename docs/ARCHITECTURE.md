# Personal Productivity Web Application Architecture

## 1. System Overview
The Personal Productivity Web Application is a modular monolith designed for a working professional balancing engineering responsibilities, continuous technical upskilling, personal obligations, and long-term goals.

### Runtime Architecture
- **Frontend**: Angular 21 (Standalone Components, TypeScript, SCSS tokens, RxJS, Lucide icons)
  - URL: `http://localhost:4201`
  - Development proxy: `/api` -> `http://localhost:8081`
- **Backend**: Spring Boot 4.x (Java 21 LTS, Spring Data JPA, Spring Security, Jakarta Bean Validation, Spring Mail, Spring Scheduling)
  - URL: `http://localhost:8081`
  - Context path / API prefix: `/api/v1`
- **Database**: PostgreSQL 18 (Relational, Flyway schema migrations, UTC timestamps, UUID primary keys)
  - Host: `localhost:5432`
  - Database: `myapplication_db`

---

## 2. Visual Style & Design Direction (Arclight Console Adaptation)
Adapted from the mission-grade operations console aesthetic:
- **Foundation**: Dark charcoal & near-black (`#0B0D10`, `#101318`, `#14181E`)
- **Accent**: Restrained warm gold & amber (`#C6A56A`, hover `#D9BA80`)
- **Dividers & Borders**: Low-contrast borders (`#292F38`) with subtle hairline dividers
- **Typography**:
  - `Inter` for clean, high-legibility body UI
  - `JetBrains Mono` for tabular metrics, telemetry chips, timestamps, and hotkey pills
  - `Fraunces` for refined display headings
- **Density**: Purposeful operational density balanced with clean whitespace; no generic cards or fluffy illustrations.

---

## 3. Modular Monolith Backend Structure
```
backend/src/main/java/com/personal/productivity/
├── config/             # Security, CORS, WebMvc, Async, Mail configurations
├── security/           # UserPrincipal, Session Management, PasswordEncoder
├── auth/               # Registration, Login, Session verification
├── dashboard/          # Today's agenda, workload calculation, upcoming deadlines
├── tasks/              # CRUD, statuses, subtasks, recurrence, dependencies
├── calendar/           # Month/Week/Day scheduling, task synchronization
├── notes/              # Notes with markdown support, tags, search
├── learning/           # Skills roadmaps, modules, topics, practice logs, revision intervals
├── habits/             # Recurring habits, streaks, calendar entries
├── focus/              # Focus timer, session logging, estimated vs actual analytics
├── goals/              # Goal tracking, milestones, linked roadmap/tasks
├── reminders/          # Persistent reminder queue, email notification dispatcher
├── reviews/            # End-of-day reviews, unfinished task carry-forward
├── analytics/          # Completion rates, time by category, learning hours
└── common/             # Global exception handlers, DTO wrappers, HealthController
```

---

## 4. Frontend Application Architecture
```
frontend/src/app/
├── core/               # Auth guards, HTTP interceptors, global services
├── shared/             # Buttons, badges, modal dialogs, data tables, empty states
├── layout/             # Console layout, persistent sidebar, topbar, command palette
└── features/
    ├── dashboard/      # Daily command center, metrics, agenda, time capacity
    ├── tasks/          # Kanban board, list view, task detail & drawer
    ├── calendar/       # Interactive Month/Week/Day scheduler
    ├── notes/          # Personal knowledge library, search & tagging
    ├── learning/       # Skill roadmaps, module tracking, revision scheduler
    ├── habits/         # Consistency tracker
    ├── focus/          # Focus timer (Pomodoro & stopwatch) & time tracking
    ├── goals/          # Strategic goals and milestone progress
    ├── reviews/        # End-of-day review wizard
    └── settings/       # Working hours, study availability, notifications
```

---

## 5. Security & Isolation
- **Authentication**: Server-side session authentication with HTTP-only cookies and bcrypt password hashing.
- **Tenant Isolation**: Every database entity enforces user ownership (`user_id = :authenticatedUserId`). No user can query or mutate another user's records.
- **Data Protection**: Sensitive credentials (passwords, SMTP secrets) are never returned in API payloads or logged.
