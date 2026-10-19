package com.personal.productivity.review.dto;

import java.time.Instant;
import java.util.UUID;

public record LearningCompletedItemDto(
    UUID topicId,
    String topicTitle,
    String moduleTitle,
    String roadmapSkill,
    Instant completedAt
) {}
