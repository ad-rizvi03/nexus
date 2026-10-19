package com.personal.productivity.notes.dto;

import com.personal.productivity.notes.ResourceType;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public class SavedResourceDto {

    public record Request(
            @NotBlank(message = "Title is required")
            String title,
            String url,
            String description,
            ResourceType resourceType,
            UUID learningTopicId
    ) {}

    public record Response(
            UUID id,
            String title,
            String url,
            String description,
            ResourceType resourceType,
            UUID learningTopicId,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
