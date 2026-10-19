package com.personal.productivity.tasks.dto;

import com.personal.productivity.tasks.TaskPriority;
import com.personal.productivity.tasks.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record TaskRequest(
    @NotBlank(message = "Task title is required")
    @Size(min = 1, max = 255, message = "Task title cannot exceed 255 characters")
    String title,

    String description,
    TaskStatus status,
    TaskPriority priority,
    UUID categoryId,
    LocalDate plannedDate,
    LocalTime startTime,
    LocalTime endTime,
    LocalDate deadlineDate,
    LocalTime deadlineTime,
    Integer estimatedDurationMinutes,
    String recurrenceRule
) {}
