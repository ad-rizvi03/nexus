package com.personal.productivity.tasks.dto;

import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskPriority;
import com.personal.productivity.tasks.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record TaskResponse(
    UUID id,
    String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    CategoryDto category,
    LocalDate plannedDate,
    LocalTime startTime,
    LocalTime endTime,
    LocalDate deadlineDate,
    LocalTime deadlineTime,
    Integer estimatedDurationMinutes,
    Instant completedAt,
    String recurrenceRule,
    List<SubtaskDto> subtasks,
    Instant createdAt,
    Instant updatedAt
) {
    public static TaskResponse fromEntity(Task task) {
        if (task == null) return null;
        List<SubtaskDto> subtaskDtos = task.getSubtasks() != null
                ? task.getSubtasks().stream().map(SubtaskDto::fromEntity).toList()
                : Collections.emptyList();

        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getPriority(),
            CategoryDto.fromEntity(task.getCategory()),
            task.getPlannedDate(),
            task.getStartTime(),
            task.getEndTime(),
            task.getDeadlineDate(),
            task.getDeadlineTime(),
            task.getEstimatedDurationMinutes(),
            task.getCompletedAt(),
            task.getRecurrenceRule(),
            subtaskDtos,
            task.getCreatedAt(),
            task.getUpdatedAt()
        );
    }
}
