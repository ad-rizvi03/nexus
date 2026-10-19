package com.personal.productivity.habits.dto;

import java.time.LocalDate;
import java.util.UUID;

public class HabitEntryDto {

    public record ToggleRequest(
            LocalDate entryDate,
            Boolean completed,
            Integer durationMinutes,
            String notes
    ) {}

    public record Response(
            UUID id,
            UUID habitId,
            LocalDate entryDate,
            boolean completed,
            Integer durationMinutes,
            String notes
    ) {}
}
