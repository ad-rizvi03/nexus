package com.personal.productivity.review.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TaskTriageRequest(
    UUID taskId,
    TaskTriageAction action,
    LocalDate rescheduleDate,
    LocalTime rescheduleStartTime,
    String blockedReason,
    List<String> subtasks
) {}
