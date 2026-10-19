package com.personal.productivity.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 100, message = "Display name must be between 2 and 100 characters")
    String displayName,

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    String email
) {}
