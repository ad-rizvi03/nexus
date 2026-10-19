# REST API Specification (Prefix: `/api/v1`)

## 1. General Principles
- Base URL: `http://localhost:8081/api/v1`
- Content-Type: `application/json`
- Session cookie authentication
- All endpoints validate inputs and return standard error structures:
```json
{
  "timestamp": "2026-10-19T14:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 Health & System
- `GET /api/v1/health`
  - Response: `{ "status": "UP", "database": "CONNECTED", "service": "...", "timestamp": "..." }`
- `GET /api/v1/actuator/health`

### 2.2 Authentication & User
- `POST /api/v1/auth/register` - `{ email, password, displayName }`
- `POST /api/v1/auth/login` - `{ email, password }`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me` - Authenticated user details & settings
- `PUT /api/v1/auth/profile` - Update display name, email
- `PUT /api/v1/auth/password` - Change password

### 2.3 User Settings
- `GET /api/v1/settings`
- `PUT /api/v1/settings` - Working hours, study availability, timezone

### 2.4 Tasks & Subtasks
- `GET /api/v1/tasks` (Filters: `status`, `priority`, `categoryId`, `plannedDate`, `deadlineDate`, `search`)
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/{id}`
- `PUT /api/v1/tasks/{id}`
- `PATCH /api/v1/tasks/{id}/status` - `{ "status": "COMPLETED" }`
- `DELETE /api/v1/tasks/{id}`
- `POST /api/v1/tasks/{id}/subtasks`
- `PATCH /api/v1/tasks/subtasks/{subtaskId}/toggle`
- `DELETE /api/v1/tasks/subtasks/{subtaskId}`

### 2.5 Dashboard & Planning
- `GET /api/v1/dashboard/today` - Today's tasks, overdue tasks, time capacity vs scheduled work
- `GET /api/v1/dashboard/suggestions` - Rule-based scheduling suggestions

### 2.6 Calendar
- `GET /api/v1/calendar/events` (Query: `startDate`, `endDate`)
- `PUT /api/v1/calendar/reschedule/{taskId}` - `{ "plannedDate": "2026-10-25" }`

### 2.7 Notes & Knowledge
- `GET /api/v1/notes` (Query: `search`, `categoryId`, `tagId`, `isPinned`)
- `POST /api/v1/notes`
- `GET /api/v1/notes/{id}`
- `PUT /api/v1/notes/{id}`
- `DELETE /api/v1/notes/{id}`
- `GET /api/v1/resources`
- `POST /api/v1/resources`

### 2.8 Learning Roadmaps
- `GET /api/v1/learning/roadmaps`
- `POST /api/v1/learning/roadmaps`
- `GET /api/v1/learning/roadmaps/{id}`
- `POST /api/v1/learning/roadmaps/{id}/modules`
- `POST /api/v1/learning/modules/{moduleId}/topics`
- `PATCH /api/v1/learning/topics/{topicId}/status`
- `GET /api/v1/learning/revisions`
- `POST /api/v1/learning/practice-logs`

### 2.9 Goals & Habits
- `GET /api/v1/goals`
- `POST /api/v1/goals`
- `POST /api/v1/goals/{id}/milestones`
- `PATCH /api/v1/goals/milestones/{milestoneId}/toggle`
- `GET /api/v1/habits`
- `POST /api/v1/habits`
- `POST /api/v1/habits/{id}/entries` - Log habit completion for date

### 2.10 Focus & Reviews
- `POST /api/v1/focus/sessions` - Log or start focus session
- `GET /api/v1/focus/summary`
- `GET /api/v1/reviews/today`
- `POST /api/v1/reviews/complete` - End of day review submission
- `GET /api/v1/analytics/summary`
