package com.personal.productivity.tasks.dto;

import com.personal.productivity.tasks.Subtask;
import java.util.UUID;

public record SubtaskDto(
    UUID id,
    String title,
    boolean completed,
    Integer estimatedDurationMinutes,
    int sortOrder
) {
    public static SubtaskDto fromEntity(Subtask entity) {
        if (entity == null) return null;
        return new SubtaskDto(
            entity.getId(),
            entity.getTitle(),
            entity.isCompleted(),
            entity.getEstimatedDurationMinutes(),
            entity.getSortOrder()
        );
    }
}
