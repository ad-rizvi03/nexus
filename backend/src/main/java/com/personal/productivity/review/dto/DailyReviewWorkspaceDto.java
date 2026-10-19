package com.personal.productivity.review.dto;

import com.personal.productivity.tasks.dto.TaskResponse;
import java.time.LocalDate;
import java.util.List;

public record DailyReviewWorkspaceDto(
    LocalDate reviewDate,
    boolean completed,
    DailyReviewDto review,
    List<TaskResponse> completedTasks,
    List<TaskResponse> unfinishedTasks,
    List<TaskResponse> missedDeadlines,
    int timeTrackedMinutes,
    List<LearningCompletedItemDto> learningTopicsCompleted,
    List<GoalProgressedItemDto> goalsProgressed,
    int habitsCompletedCount,
    int totalCompletedTasks,
    int totalUnfinishedTasks,
    int totalMissedDeadlines
) {}
