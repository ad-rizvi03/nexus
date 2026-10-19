package com.personal.productivity.learning.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class RevisionSessionDto {
    public record Request(
            @NotNull(message = "Topic ID is required")
            UUID topicId,
            @NotNull(message = "Scheduled date is required")
            LocalDate scheduledDate,
            String notes
    ) {}

    public record Response(
            UUID id,
            UUID topicId,
            String topicTitle,
            String moduleTitle,
            String roadmapSkillName,
            LocalDate scheduledDate,
            Boolean completed,
            Instant completedAt,
            String notes,
            Instant createdAt
    ) {}
}
