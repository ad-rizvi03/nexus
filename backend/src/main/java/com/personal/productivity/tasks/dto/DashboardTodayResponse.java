package com.personal.productivity.tasks.dto;

import java.util.List;

public record DashboardTodayResponse(
    List<TaskResponse> todayTasks,
    List<TaskResponse> overdueTasks,
    List<TaskResponse> inProgressTasks,
    int totalPlannedMinutesToday,
    int availableMinutesToday,
    int remainingCapacityMinutes,
    boolean isOverloaded,
    int completedCountToday,
    int activeCountToday
) {}
