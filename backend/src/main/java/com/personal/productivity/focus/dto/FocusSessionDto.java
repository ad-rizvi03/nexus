package com.personal.productivity.focus.dto;

import com.personal.productivity.focus.SessionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class FocusSessionDto {

    public record StartRequest(
            UUID taskId,
            UUID learningTopicId,
            SessionType sessionType,
            String notes
    ) {}

    public record StopRequest(
            Integer durationMinutes,
            String notes
    ) {}

    public record ManualRequest(
            UUID taskId,
            UUID learningTopicId,
            Instant startTime,
            @NotNull(message = "Duration in minutes is required")
            @Min(value = 1, message = "Duration must be at least 1 minute")
            Integer durationMinutes,
            SessionType sessionType,
            String notes
    ) {}

    public record Response(
            UUID id,
            UUID taskId,
            String taskTitle,
            UUID learningTopicId,
            String learningTopicTitle,
            Instant startTime,
            Instant endTime,
            Integer durationMinutes,
            SessionType sessionType,
            String notes,
            boolean isRunning,
            Instant createdAt
    ) {}

    public record SummaryResponse(
            int todayCompletedSessions,
            int todayFocusMinutes,
            int weekFocusMinutes,
            Response activeSession,
            List<Response> recentSessions
    ) {}
}
