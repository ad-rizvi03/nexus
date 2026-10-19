package com.personal.productivity.habits;

import com.personal.productivity.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "habits")
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_frequency", nullable = false, length = 32)
    private HabitFrequency targetFrequency = HabitFrequency.DAILY;

    @Column(name = "target_duration_minutes")
    private Integer targetDurationMinutes;

    @Column(name = "is_paused", nullable = false)
    private Boolean isPaused = false;

    @OneToMany(mappedBy = "habit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<HabitEntry> entries = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Habit() {}

    public Habit(User user, String name, String description, HabitFrequency targetFrequency, Integer targetDurationMinutes) {
        this.user = user;
        this.name = name;
        this.description = description;
        this.targetFrequency = targetFrequency != null ? targetFrequency : HabitFrequency.DAILY;
        this.targetDurationMinutes = targetDurationMinutes;
        this.isPaused = false;
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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public HabitFrequency getTargetFrequency() { return targetFrequency; }
    public void setTargetFrequency(HabitFrequency targetFrequency) { this.targetFrequency = targetFrequency; }

    public Integer getTargetDurationMinutes() { return targetDurationMinutes; }
    public void setTargetDurationMinutes(Integer targetDurationMinutes) { this.targetDurationMinutes = targetDurationMinutes; }

    public Boolean getIsPaused() { return isPaused; }
    public void setIsPaused(Boolean isPaused) { this.isPaused = isPaused != null ? isPaused : false; }

    public List<HabitEntry> getEntries() { return entries; }
    public void setEntries(List<HabitEntry> entries) { this.entries = entries; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
