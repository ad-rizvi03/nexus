package com.personal.productivity.auth.dto;

import com.personal.productivity.settings.dto.UserSettingsDto;

public record UserProfileResponse(
    UserResponse user,
    UserSettingsDto settings
) {}
