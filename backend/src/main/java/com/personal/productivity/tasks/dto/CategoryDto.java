package com.personal.productivity.tasks.dto;

import com.personal.productivity.tasks.Category;
import java.util.UUID;

public record CategoryDto(
    UUID id,
    String name,
    String color,
    String icon,
    int sortOrder
) {
    public static CategoryDto fromEntity(Category entity) {
        if (entity == null) return null;
        return new CategoryDto(
            entity.getId(),
            entity.getName(),
            entity.getColor(),
            entity.getIcon(),
            entity.getSortOrder()
        );
    }
}
