package com.personal.productivity.learning;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "learning_topics")
public class LearningTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false)
    private LearningModule module;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TopicStatus status = TopicStatus.NOT_STARTED;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public LearningTopic() {}

    public LearningTopic(LearningModule module, String title, Integer estimatedMinutes, Integer sortOrder) {
        this.module = module;
        this.title = title;
        this.estimatedMinutes = estimatedMinutes;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.status = TopicStatus.NOT_STARTED;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public LearningModule getModule() { return module; }
    public void setModule(LearningModule module) { this.module = module; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public TopicStatus getStatus() { return status; }
    public void setStatus(TopicStatus status) {
        this.status = status;
        if (status == TopicStatus.COMPLETED && this.completedAt == null) {
            this.completedAt = Instant.now();
        } else if (status != TopicStatus.COMPLETED) {
            this.completedAt = null;
        }
    }

    public Integer getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(Integer estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
