package com.personal.productivity.reminders.dto;

import com.personal.productivity.reminders.NotificationType;
import com.personal.productivity.reminders.Reminder;
import com.personal.productivity.reminders.ReminderStatus;

import java.time.Instant;
import java.util.UUID;

public record ReminderDto(
    UUID id,
    UUID taskId,
    String taskTitle,
    Instant scheduledAt,
    NotificationType notificationType,
    ReminderStatus status,
    int attemptCount,
    String lastError,
    Instant sentAt,
    Instant createdAt
) {
    public static ReminderDto fromEntity(Reminder r) {
        if (r == null) return null;
        return new ReminderDto(
            r.getId(),
            r.getTask() != null ? r.getTask().getId() : null,
            r.getTask() != null ? r.getTask().getTitle() : null,
            r.getScheduledAt(),
            r.getNotificationType(),
            r.getStatus(),
            r.getAttemptCount(),
            r.getLastError(),
            r.getSentAt(),
            r.getCreatedAt()
        );
    }
}
