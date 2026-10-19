# Database Design & Entity Relationship Specification

## 1. Overview
The database layer uses PostgreSQL 18 with Flyway migrations. All tables use UUID (`gen_random_uuid()`) primary keys for security and idempotency, explicit foreign key constraints with cascade behaviors, and `timestamptz` for timestamps.

---

## 2. Entity Relationship Overview

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

+-------------------------------------------------------------+
|                     learning_roadmaps                       |
|   (id, user_id, goal_id, skill_name, weekly_target_hours)   |
+-------------------------------------------------------------+
        |
        | 1:N
        v
+------------------+
| learning_modules |
+------------------+
        |
        | 1:N
        v
+------------------+ <-----+ revision_sessions
| learning_topics  | <-----+ practice_logs
+------------------+ <-----+ saved_resources
```

---

## 3. Core Relational Schema

### 3.1 Users & Settings
- **`users`**: `id (UUID PK)`, `email (VARCHAR UNIQUE)`, `password_hash (VARCHAR)`, `display_name (VARCHAR)`, `created_at`, `updated_at`.
- **`user_settings`**: `id (UUID PK)`, `user_id (UUID FK UNIQUE)`, `time_zone`, `first_day_of_week`, `work_start_time`, `work_end_time`, `commute_minutes`, `weekday_study_hours`, `weekend_study_hours`, `default_task_duration_minutes`, `daily_agenda_time`, `review_reminder_time`, `theme_preference`, `date_format_preference`.

### 3.2 Organization
- **`categories`**: `id (UUID PK)`, `user_id (UUID FK)`, `name`, `color`, `icon`, `sort_order`, `UNIQUE(user_id, name)`.
- **`tags`**: `id (UUID PK)`, `user_id (UUID FK)`, `name`, `UNIQUE(user_id, name)`.

### 3.3 Tasks & Execution
- **`tasks`**: `id (UUID PK)`, `user_id (UUID FK)`, `category_id (UUID FK)`, `goal_id (UUID FK)`, `learning_topic_id (UUID FK)`, `title`, `description`, `status (TO_DO, IN_PROGRESS, BLOCKED, COMPLETED)`, `priority (LOW, MEDIUM, HIGH, URGENT)`, `planned_date`, `start_time`, `end_time`, `deadline_date`, `deadline_time`, `estimated_duration_minutes`, `completed_at`, `recurrence_rule`.
- **`subtasks`**: `id (UUID PK)`, `task_id (UUID FK)`, `title`, `completed`, `estimated_duration_minutes`, `sort_order`.
- **`task_tags`**: `task_id (UUID FK)`, `tag_id (UUID FK)`.
- **`task_dependencies`**: `task_id (UUID FK)`, `depends_on_task_id (UUID FK)`.

### 3.4 Learning & Knowledge
- **`learning_roadmaps`**: `id (UUID PK)`, `user_id (UUID FK)`, `goal_id (UUID FK)`, `skill_name`, `objective`, `start_date`, `target_completion_date`, `weekly_target_hours`, `status`.
- **`learning_modules`**: `id (UUID PK)`, `roadmap_id (UUID FK)`, `title`, `description`, `sort_order`, `status`.
- **`learning_topics`**: `id (UUID PK)`, `module_id (UUID FK)`, `title`, `status`, `estimated_minutes`, `completed_at`, `sort_order`.
- **`revision_sessions`**: `id (UUID PK)`, `user_id (UUID FK)`, `topic_id (UUID FK)`, `scheduled_date`, `completed`, `completed_at`, `notes`.
- **`practice_logs`**: `id (UUID PK)`, `user_id (UUID FK)`, `roadmap_id`, `topic_id`, `log_date`, `problems_solved`, `minutes_spent`, `concept_summary`, `mistakes_and_notes`.
- **`notes`**: `id (UUID PK)`, `user_id (UUID FK)`, `category_id`, `task_id`, `learning_topic_id`, `goal_id`, `title`, `content (Markdown)`, `is_pinned`.
- **`saved_resources`**: `id (UUID PK)`, `user_id (UUID FK)`, `learning_topic_id`, `title`, `url`, `description`, `resource_type`.

### 3.5 Habits, Focus & Reviews
- **`goals`**: `id (UUID PK)`, `user_id (UUID FK)`, `name`, `description`, `category_id`, `target_date`, `status`, `progress_percentage`, `review_notes`.
- **`goal_milestones`**: `id (UUID PK)`, `goal_id (UUID FK)`, `title`, `target_date`, `completed`, `completed_at`, `sort_order`.
- **`habits`**: `id (UUID PK)`, `user_id (UUID FK)`, `name`, `description`, `target_frequency`, `target_duration_minutes`, `is_paused`.
- **`habit_entries`**: `id (UUID PK)`, `habit_id (UUID FK)`, `entry_date`, `completed`, `duration_minutes`, `notes`, `UNIQUE(habit_id, entry_date)`.
- **`focus_sessions`**: `id (UUID PK)`, `user_id (UUID FK)`, `task_id`, `learning_topic_id`, `start_time`, `end_time`, `duration_minutes`, `session_type`, `notes`.
- **`daily_reviews`**: `id (UUID PK)`, `user_id (UUID FK)`, `review_date`, `completed_task_count`, `unfinished_task_count`, `total_time_tracked_minutes`, `reflection_notes`, `UNIQUE(user_id, review_date)`.
- **`reminders`**: `id (UUID PK)`, `user_id (UUID FK)`, `task_id`, `scheduled_at`, `notification_type`, `status`, `attempt_count`, `last_error`, `sent_at`.
