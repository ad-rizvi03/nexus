package com.personal.productivity.planner.dto;

import com.personal.productivity.tasks.TaskPriority;
import java.time.LocalTime;
import java.util.UUID;

public record SmartPlanSlotDto(
    String slotId,
    UUID taskId,
    String taskTitle,
    String categoryName,
    String categoryColor,
    TaskPriority priority,
    String slotType, // WORK_BLOCK, STUDY_BLOCK, PERSONAL_BLOCK, BREAK, COMMUTE
    LocalTime startTime,
    LocalTime endTime,
    int durationMinutes,
    String rationale,
    boolean accepted
) {}
