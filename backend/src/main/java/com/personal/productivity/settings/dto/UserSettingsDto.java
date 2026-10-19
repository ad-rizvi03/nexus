package com.personal.productivity.settings.dto;

import com.personal.productivity.settings.UserSettings;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalTime;

public record UserSettingsDto(
    @NotBlank String timeZone,
    @Min(1) @Max(7) int firstDayOfWeek,
    @NotNull LocalTime workStartTime,
    @NotNull LocalTime workEndTime,
    @Min(0) int commuteMinutes,
    @NotNull BigDecimal weekdayStudyHours,
    @NotNull BigDecimal weekendStudyHours,
    @Min(5) int defaultTaskDurationMinutes,
    @NotNull LocalTime dailyAgendaTime,
    @NotNull LocalTime reviewReminderTime,
    @NotBlank String themePreference,
    @NotBlank String dateFormatPreference
) {
    public static UserSettingsDto fromEntity(UserSettings entity) {
        return new UserSettingsDto(
            entity.getTimeZone(),
            entity.getFirstDayOfWeek(),
            entity.getWorkStartTime(),
            entity.getWorkEndTime(),
            entity.getCommuteMinutes(),
            entity.getWeekdayStudyHours(),
            entity.getWeekendStudyHours(),
            entity.getDefaultTaskDurationMinutes(),
            entity.getDailyAgendaTime(),
            entity.getReviewReminderTime(),
            entity.getThemePreference(),
            entity.getDateFormatPreference()
        );
    }
}
