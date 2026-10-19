package com.personal.productivity.notes.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class NoteDto {

    public record Request(
            @NotBlank(message = "Title is required")
            String title,
            String content,
            UUID categoryId,
            UUID taskId,
            UUID learningTopicId,
            UUID goalId,
            Boolean isPinned,
            List<String> tags
    ) {}

    public record Response(
            UUID id,
            String title,
            String content,
            UUID categoryId,
            String categoryName,
            String categoryColor,
            UUID taskId,
            UUID learningTopicId,
            UUID goalId,
            boolean isPinned,
            List<String> tags,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
