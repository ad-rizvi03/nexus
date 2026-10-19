package com.personal.productivity.tasks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
    @NotBlank(message = "Category name is required")
    @Size(min = 1, max = 64, message = "Category name must be between 1 and 64 characters")
    String name,

    String color,
    String icon,
    int sortOrder
) {}
