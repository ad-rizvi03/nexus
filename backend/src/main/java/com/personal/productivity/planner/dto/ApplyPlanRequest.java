package com.personal.productivity.planner.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ApplyPlanRequest(
    LocalDate targetDate,
    List<SlotApplyItem> slots
) {
    public record SlotApplyItem(
        UUID taskId,
        LocalTime startTime,
        LocalTime endTime,
        LocalDate plannedDate
    ) {}
}
