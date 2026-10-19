package com.personal.productivity.planner.dto;

import com.personal.productivity.tasks.TaskPriority;
import java.time.LocalDate;
import java.time.LocalTime;

public record NaturalLanguageParsedDto(
    String originalInput,
    String title,
    LocalDate plannedDate,
    LocalTime startTime,
    Integer estimatedDurationMinutes,
    TaskPriority priority,
    String confidence, // HIGH, MEDIUM, LOW
    String explanation
) {}
