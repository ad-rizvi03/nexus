# Nexus — Personal Productivity & Knowledge OS

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Java](https://img.shields.io/badge/Java-21%20LTS-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Copilot-8E75B2?logo=googlegemini&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)

**A high-performance personal operating system designed for software engineers, continuous learners, and operators balancing deep work, technical upskilling, and strategic goals.**

[Explore Architecture](docs/ARCHITECTURE.md) • [Database Design](docs/DATABASE_DESIGN.md) • [API Specification](docs/API_SPECIFICATION.md)

</div>

---

## 🌟 Executive Overview

**Nexus** is an all-in-one productivity and cognitive telemetry environment. It bridges task execution with continuous learning and strategic trajectory tracking:

- **AI-Powered Upskilling Co-Pilot**: Real-time study duration estimation, modular syllabus generation, and curated YouTube video research powered by **Google Gemini**.
- **Deterministic Smart Planning**: Rule-based schedule allocation that accounts for commute, working hours, and study buffers to prevent cognitive overload.
- **Mission-Grade Interface**: Arclight Console aesthetic featuring high-density data typography, gold amber accents, and zero distracting UI clutter.
- **Spaced Repetition & Upskilling Engine**: SM-2 spaced repetition for technical topics, continuous practice logs, and roadmap progress tracking.
- **Focus Telemetry & Interruption Auditing**: Active Pomodoro cycles, session state recovery across browser reloads, and focus health analytics.

---

## 🚀 Key Features

### 1. 🤖 Live Gemini AI Learning & Task Co-Pilot
- **Real-Time Duration Estimation**: Enter any complex skill (e.g. *“Master Rust Memory Management”* or *“Build Distributed Systems with Kafka”*) and receive accurate study hours based on prerequisite analysis.
- **Structured Syllabi**: Automatically breakdowns skills into sequenced, actionable modules with duration breakdowns.
- **Curated Video Research**: Fetches verified, top-rated YouTube tutorials with direct links, authors, and difficulty level ratings.
- **One-Click Task Generation**: Export AI-generated modules straight into active tasks and milestones.

### 2. ⚡ Quick Capture & Natural Language Parsing
- Instant floating capture dialog accessible anywhere in the workspace (`Alt + Q` or Topbar button).
- Regex and token parser automatically detects:
  - **Date & Time**: `tomorrow at 10am`, `next monday 4pm`
  - **Duration**: `45m`, `2h`, `90 minutes`
  - **Priority Tags**: `urgent`, `p1`, `important`, `low`

### 3. 📅 Smart Daily Scheduler & Capacity Engine
- Evaluates individual availability against configurable user settings (work start/end times, commute buffer, weekday/weekend study quotas).
- Generates categorized daily blocks: Deep Work, Learning, Routine, and Rest.
- Real-time overload indicators notify when planned tasks exceed available cognitive bandwidth.

### 4. 🎯 Strategic Goals & Milestone Health Telemetry
- Hierarchical multi-quarter goals with measurable target dates.
- Automated health index calculation (`ON_TRACK`, `AT_RISK`, `CRITICAL`) based on milestone completion velocities.

### 5. 🧠 Spaced Repetition (SuperMemo SM-2)
- Technical topic mastery system calculating optimal next review intervals using easiness factors and repetition counts.
- Daily revision queues ensure concepts are reinforced right before memory decay occurs.

### 6. ⏱️ Focus Timer & State Recovery
- Configurable Pomodoro focus cycles with work and break phases.
- Real-time state persistence to PostgreSQL ensures active sessions survive accidental tab closes or browser restarts.
- Unplanned interruption logging for focus fidelity telemetry.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Angular 21 (Standalone Components), TypeScript, SCSS Design Tokens, RxJS, Lucide Icons |
| **Backend** | Spring Boot 4.x, Java 21 LTS, Spring Data JPA, Spring Security, Jakarta Bean Validation |
| **Database** | PostgreSQL 18, Flyway Migrations, UTC Timestamps, UUID Primary Keys |
| **AI Integration** | Google Gemini (`gemini-3.5-flash-lite`), REST Client |
| **Tooling** | Maven Wrapper, Angular CLI, Node.js |

---

## 🏗️ Repository Architecture

```
nexus/
├── backend/                             # Spring Boot Application
│   ├── src/main/java/com/personal/productivity/
│   │   ├── ai/                          # Gemini AI Client & Prompt Engineering
│   │   ├── auth/                        # Security, JWT & User Credentials
│   │   ├── calendar/                    # Smart Daily Planner & Timeline
│   │   ├── focus/                       # Focus Sessions & Interruption Logs
│   │   ├── goals/                       # Strategic Goals & Milestones
│   │   ├── habits/                      # Daily Habit Streaks & Tracking
│   │   ├── learning/                    # Roadmaps, Topics & Spaced Repetition
│   │   ├── notes/                       # Markdown Scratchpad & Knowledge Archive
│   │   ├── review/                      # Evening Reviews & Triage Matrix
│   │   ├── settings/                    # Profile & Schedule Availability Constraints
│   │   └── tasks/                       # Tasks, Subtasks & Quick Capture
│   └── src/main/resources/
│       ├── application.yml              # Database & API configuration
│       └── db/migration/                # Flyway schema migrations
├── frontend/                            # Angular 21 Application
│   ├── src/app/
│   │   ├── core/                        # HTTP Interceptors, Guards & Services
│   │   ├── features/                    # Feature modules (Dashboard, Goals, AI...)
│   │   ├── layout/                      # Console Sidebar, Topbar, Quick Capture
│   │   └── shared/                      # AI Modal, Confirm Dialogs, Toast Notifications
│   └── src/styles.scss                  # Arclight Console dark design tokens
└── docs/                                # Technical Specifications
    ├── ARCHITECTURE.md                  # Comprehensive architectural blueprints
    ├── DATABASE_DESIGN.md               # Entity relational schemas & indexing
    └── API_SPECIFICATION.md             # REST API contracts
```

---

## 🚦 Getting Started

### Prerequisites
- **Java 21 LTS** installed (`java -version`)
- **Node.js 20+** and `npm` installed
- **PostgreSQL 18** running locally on port `5432`

---

### 1. Database Configuration
1. Ensure PostgreSQL is active on port `5432`.
2. Create the database:
   ```sql
   CREATE DATABASE nexus;
   ```
3. Configure your database credentials in [application.yml](backend/src/main/resources/application.yml) or via environment variables:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/nexus
       username: postgres
       password: your_password
   ```

---

### 2. Google Gemini AI Setup (Optional for Live AI)
Supply your Gemini API key in `application.yml` or as an environment variable:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

---

### 3. Running the Backend
From the root directory:
```bash
cd backend
./mvnw spring-boot:run
```
The backend starts at `http://localhost:8081/api/v1`.
Verify health check:
```bash
curl http://localhost:8081/api/v1/health
```

---

### 4. Running the Frontend
From the root directory in a separate terminal:
```bash
cd frontend
npm install
npm start
```
The application will launch on `http://localhost:4201`.

---

## 🔐 Default Development Credentials

For rapid local testing and development:
- **Email**: `adnanrizvi156@outlook.com`
- **Password**: `SecureP@ss123`

---

## 📜 Database & Entity Model

```
+-------------------------------------------------------------+
|                            users                            |
| (id, email, password_hash, display_name, created_at, ...)   |
+-------------------------------------------------------------+
        |                  |                 |             |
        | 1:1              | 1:N             | 1:N         | 1:N
        v                  v                 v             v
+---------------+  +--------------+  +-----------+  +-------------+
| user_settings |  |  categories  |  |   tags    |  |    goals    |
+---------------+  +--------------+  +-----------+  +-------------+
                            |                              |
                            | 1:N                          | 1:N
                            v                              v
                    +--------------+              +-----------------+
                    |    tasks     |              | goal_milestones |
                    +--------------+              +-----------------+
                      |    |    |
        +-------------+    |    +-------------+
        | 1:N              | M:N              | 1:N
        v                  v                  v
+-------------+    +-------------+    +-------------------+
|  subtasks   |    |  task_tags  |    | task_dependencies |
+-------------+    +-------------+    +-------------------+
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
