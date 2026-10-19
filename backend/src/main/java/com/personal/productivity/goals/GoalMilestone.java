package com.personal.productivity.goals;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "goal_milestones")
public class GoalMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public GoalMilestone() {}

    public GoalMilestone(Goal goal, String title, LocalDate targetDate, Boolean completed, int sortOrder) {
        this.goal = goal;
        this.title = title;
        this.targetDate = targetDate;
        this.completed = completed != null ? completed : false;
        this.completedAt = Boolean.TRUE.equals(this.completed) ? Instant.now() : null;
        this.sortOrder = sortOrder;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Goal getGoal() { return goal; }
    public void setGoal(Goal goal) { this.goal = goal; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) {
        this.completed = completed != null ? completed : false;
        if (Boolean.TRUE.equals(this.completed) && this.completedAt == null) {
            this.completedAt = Instant.now();
        } else if (!Boolean.TRUE.equals(this.completed)) {
            this.completedAt = null;
        }
    }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public Instant getCreatedAt() { return createdAt; }
}
