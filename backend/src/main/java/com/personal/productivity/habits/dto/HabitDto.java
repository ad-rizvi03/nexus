package com.personal.productivity.habits.dto;

import com.personal.productivity.habits.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class HabitDto {

    public record Request(
            @NotBlank(message = "Habit name is required")
            String name,
            String description,
            HabitFrequency targetFrequency,
            Integer targetDurationMinutes,
            Boolean isPaused
    ) {}

    public record Response(
            UUID id,
            String name,
            String description,
            HabitFrequency targetFrequency,
            Integer targetDurationMinutes,
            boolean isPaused,
            int currentStreak,
            int longestStreak,
            int totalCompletions,
            double completionRate30d,
            LocalDate lastEntryDate,
            Map<String, Boolean> recentEntries,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record SummaryResponse(
            int totalActiveHabits,
            int totalPausedHabits,
            int completedTodayCount,
            double overallCompletionRate,
            int bestStreakOverall,
            List<Response> habits
    ) {}
}
