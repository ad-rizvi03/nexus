package com.personal.productivity.planner.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record SmartPlanResponse(
    LocalDate targetDate,
    LocalTime workStartTime,
    LocalTime workEndTime,
    int commuteMinutes,
    int availableCapacityMinutes,
    int totalPlannedDurationMinutes,
    int overloadMinutes,
    String status, // OPTIMAL, OVERLOADED, BALANCED
    String overallSummary,
    List<SmartPlanSlotDto> slots,
    List<String> rationale,
    List<String> rulesApplied
) {}
