package com.personal.productivity.learning;

import com.personal.productivity.auth.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "learning_roadmaps")
public class LearningRoadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "goal_id")
    private UUID goalId;

    @Column(name = "skill_name", nullable = false, length = 128)
    private String skillName;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "target_completion_date")
    private LocalDate targetCompletionDate;

    @Column(name = "weekly_target_hours", precision = 4, scale = 2, nullable = false)
    private BigDecimal weeklyTargetHours = BigDecimal.valueOf(5.0);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RoadmapStatus status = RoadmapStatus.IN_PROGRESS;

    @OneToMany(mappedBy = "roadmap", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, createdAt ASC")
    private List<LearningModule> modules = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public LearningRoadmap() {}

    public LearningRoadmap(User user, String skillName, String objective, LocalDate startDate,
                           LocalDate targetCompletionDate, BigDecimal weeklyTargetHours) {
        this.user = user;
        this.skillName = skillName;
        this.objective = objective;
        this.startDate = startDate;
        this.targetCompletionDate = targetCompletionDate;
        this.weeklyTargetHours = weeklyTargetHours != null ? weeklyTargetHours : BigDecimal.valueOf(5.0);
        this.status = RoadmapStatus.IN_PROGRESS;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getTargetCompletionDate() { return targetCompletionDate; }
    public void setTargetCompletionDate(LocalDate targetCompletionDate) { this.targetCompletionDate = targetCompletionDate; }

    public BigDecimal getWeeklyTargetHours() { return weeklyTargetHours; }
    public void setWeeklyTargetHours(BigDecimal weeklyTargetHours) { this.weeklyTargetHours = weeklyTargetHours; }

    public RoadmapStatus getStatus() { return status; }
    public void setStatus(RoadmapStatus status) { this.status = status; }

    public List<LearningModule> getModules() { return modules; }
    public void setModules(List<LearningModule> modules) { this.modules = modules; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
