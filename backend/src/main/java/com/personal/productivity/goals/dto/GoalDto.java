package com.personal.productivity.goals.dto;

import com.personal.productivity.goals.GoalStatus;
import com.personal.productivity.goals.ScheduleHealth;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class GoalDto {

    public record Request(
            @NotBlank(message = "Goal name is required")
            String name,
            String description,
            UUID categoryId,
            LocalDate targetDate,
            GoalStatus status,
            String reviewNotes,
            List<GoalMilestoneDto.Request> milestones
    ) {}

    public record Response(
            UUID id,
            String name,
            String description,
            UUID categoryId,
            String categoryName,
            String categoryColor,
            LocalDate targetDate,
            GoalStatus status,
            int progressPercentage,
            String reviewNotes,
            ScheduleHealth scheduleHealth,
            List<GoalMilestoneDto.Response> milestones,
            int totalMilestones,
            int completedMilestones,
            long linkedTasksCount,
            long completedTasksCount,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record SummaryResponse(
            int totalGoals,
            int inProgressGoals,
            int completedGoals,
            double averageProgress,
            int onTrackCount,
            int approachingDeadlineCount,
            int overdueCount,
            List<Response> goals
    ) {}
}
