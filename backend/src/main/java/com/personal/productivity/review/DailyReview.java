package com.personal.productivity.review;

import com.personal.productivity.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_reviews", uniqueConstraints = {
    @UniqueConstraint(name = "uq_daily_review_user_date", columnNames = {"user_id", "review_date"})
})
public class DailyReview {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    @Column(name = "completed_task_count", nullable = false)
    private int completedTaskCount = 0;

    @Column(name = "unfinished_task_count", nullable = false)
    private int unfinishedTaskCount = 0;

    @Column(name = "missed_deadline_count", nullable = false)
    private int missedDeadlineCount = 0;

    @Column(name = "total_time_tracked_minutes", nullable = false)
    private int totalTimeTrackedMinutes = 0;

    @Column(name = "learning_completed_count", nullable = false)
    private int learningCompletedCount = 0;

    @Column(name = "goals_progressed_count", nullable = false)
    private int goalsProgressedCount = 0;

    @Column(name = "habits_completed_count", nullable = false)
    private int habitsCompletedCount = 0;

    @Column(name = "reflection_notes", columnDefinition = "TEXT")
    private String reflectionNotes;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "COMPLETED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public DailyReview() {}

    public DailyReview(User user, LocalDate reviewDate) {
        this.user = user;
        this.reviewDate = reviewDate;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDate reviewDate) {
        this.reviewDate = reviewDate;
    }

    public int getCompletedTaskCount() {
        return completedTaskCount;
    }

    public void setCompletedTaskCount(int completedTaskCount) {
        this.completedTaskCount = completedTaskCount;
    }

    public int getUnfinishedTaskCount() {
        return unfinishedTaskCount;
    }

    public void setUnfinishedTaskCount(int unfinishedTaskCount) {
        this.unfinishedTaskCount = unfinishedTaskCount;
    }

    public int getMissedDeadlineCount() {
        return missedDeadlineCount;
    }

    public void setMissedDeadlineCount(int missedDeadlineCount) {
        this.missedDeadlineCount = missedDeadlineCount;
    }

    public int getTotalTimeTrackedMinutes() {
        return totalTimeTrackedMinutes;
    }

    public void setTotalTimeTrackedMinutes(int totalTimeTrackedMinutes) {
        this.totalTimeTrackedMinutes = totalTimeTrackedMinutes;
    }

    public int getLearningCompletedCount() {
        return learningCompletedCount;
    }

    public void setLearningCompletedCount(int learningCompletedCount) {
        this.learningCompletedCount = learningCompletedCount;
    }

    public int getGoalsProgressedCount() {
        return goalsProgressedCount;
    }

    public void setGoalsProgressedCount(int goalsProgressedCount) {
        this.goalsProgressedCount = goalsProgressedCount;
    }

    public int getHabitsCompletedCount() {
        return habitsCompletedCount;
    }

    public void setHabitsCompletedCount(int habitsCompletedCount) {
        this.habitsCompletedCount = habitsCompletedCount;
    }

    public String getReflectionNotes() {
        return reflectionNotes;
    }

    public void setReflectionNotes(String reflectionNotes) {
        this.reflectionNotes = reflectionNotes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
