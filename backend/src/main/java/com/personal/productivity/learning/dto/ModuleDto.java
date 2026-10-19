package com.personal.productivity.learning.dto;

import com.personal.productivity.learning.ModuleStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ModuleDto {
    public record Request(
            @NotBlank(message = "Module title is required")
            String title,
            String description,
            Integer sortOrder,
            ModuleStatus status
    ) {}

    public record Response(
            UUID id,
            UUID roadmapId,
            String title,
            String description,
            Integer sortOrder,
            ModuleStatus status,
            List<TopicDto.Response> topics,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
