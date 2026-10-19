package com.personal.productivity.learning.dto;

import com.personal.productivity.learning.RoadmapStatus;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class RoadmapDto {
    public record Request(
            @NotBlank(message = "Skill name is required")
            String skillName,
            String objective,
            LocalDate startDate,
            LocalDate targetCompletionDate,
            BigDecimal weeklyTargetHours,
            RoadmapStatus status
    ) {}

    public record Response(
            UUID id,
            String skillName,
            String objective,
            LocalDate startDate,
            LocalDate targetCompletionDate,
            BigDecimal weeklyTargetHours,
            RoadmapStatus status,
            List<ModuleDto.Response> modules,
            long totalTopics,
            long completedTopics,
            int progressPercentage,
            long totalPracticeMinutes,
            String nextScheduledRevision,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
