package com.personal.productivity.calendar.dto;

import com.personal.productivity.tasks.TaskPriority;
import com.personal.productivity.tasks.TaskStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public class CalendarEventDto {
    public enum EventType {
        TASK_SCHEDULED,
        TASK_DEADLINE,
        REVISION_SESSION
    }

    public record Response(
            UUID id,
            String title,
            String description,
            String categoryName,
            String categoryColor,
            TaskPriority priority,
            TaskStatus status,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            Integer durationMinutes,
            EventType type,
            boolean completed,
            boolean isDeadline
    ) {}

    public record RescheduleRequest(
            LocalDate plannedDate,
            LocalTime startTime,
            LocalTime endTime
    ) {}
}
