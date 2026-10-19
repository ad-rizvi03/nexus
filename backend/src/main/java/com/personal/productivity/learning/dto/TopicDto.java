package com.personal.productivity.learning.dto;

import com.personal.productivity.learning.TopicStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public class TopicDto {
    public record Request(
            @NotBlank(message = "Topic title is required")
            String title,
            TopicStatus status,
            Integer estimatedMinutes,
            Integer sortOrder
    ) {}

    public record Response(
            UUID id,
            UUID moduleId,
            String title,
            TopicStatus status,
            Integer estimatedMinutes,
            Instant completedAt,
            Integer sortOrder,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
