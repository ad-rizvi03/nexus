package com.personal.productivity.review.dto;

import java.time.Instant;
import java.util.UUID;

public record GoalProgressedItemDto(
    UUID milestoneId,
    String milestoneTitle,
    String goalName,
    Instant completedAt
) {}
