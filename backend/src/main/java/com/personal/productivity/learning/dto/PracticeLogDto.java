package com.personal.productivity.learning.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class PracticeLogDto {
    public record Request(
            UUID roadmapId,
            UUID topicId,
            LocalDate logDate,
            Integer problemsSolved,
            @NotNull(message = "Minutes spent is required")
            Integer minutesSpent,
            String conceptSummary,
            String mistakesAndNotes
    ) {}

    public record Response(
            UUID id,
            UUID roadmapId,
            String roadmapSkillName,
            UUID topicId,
            String topicTitle,
            LocalDate logDate,
            Integer problemsSolved,
            Integer minutesSpent,
            String conceptSummary,
            String mistakesAndNotes,
            Instant createdAt
    ) {}
}
