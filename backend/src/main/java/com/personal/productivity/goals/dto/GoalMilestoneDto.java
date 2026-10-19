package com.personal.productivity.goals.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class GoalMilestoneDto {

    public record Request(
            @NotBlank(message = "Milestone title is required")
            String title,
            LocalDate targetDate,
            Boolean completed,
            Integer sortOrder
    ) {}

    public record Response(
            UUID id,
            UUID goalId,
            String title,
            LocalDate targetDate,
            boolean completed,
            Instant completedAt,
            int sortOrder,
            Instant createdAt
    ) {}
}
