package com.personal.productivity.tasks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubtaskRequest(
    @NotBlank(message = "Subtask title is required")
    @Size(min = 1, max = 255)
    String title,

    Integer estimatedDurationMinutes,
    Integer sortOrder
) {}
