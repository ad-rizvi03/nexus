package com.personal.productivity.review.dto;

import com.personal.productivity.review.DailyReview;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyReviewDto(
    UUID id,
    LocalDate reviewDate,
    int completedTaskCount,
    int unfinishedTaskCount,
    int missedDeadlineCount,
    int totalTimeTrackedMinutes,
    int learningCompletedCount,
    int goalsProgressedCount,
    int habitsCompletedCount,
    String reflectionNotes,
    String status,
    Instant createdAt,
    Instant updatedAt
) {
    public static DailyReviewDto fromEntity(DailyReview review) {
        if (review == null) return null;
        return new DailyReviewDto(
            review.getId(),
            review.getReviewDate(),
            review.getCompletedTaskCount(),
            review.getUnfinishedTaskCount(),
            review.getMissedDeadlineCount(),
            review.getTotalTimeTrackedMinutes(),
            review.getLearningCompletedCount(),
            review.getGoalsProgressedCount(),
            review.getHabitsCompletedCount(),
            review.getReflectionNotes(),
            review.getStatus(),
            review.getCreatedAt(),
            review.getUpdatedAt()
        );
    }
}
