package com.personal.productivity.focus;

import com.personal.productivity.auth.User;
import com.personal.productivity.learning.LearningTopic;
import com.personal.productivity.tasks.Task;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "focus_sessions")
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_topic_id")
    private LearningTopic learningTopic;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 32)
    private SessionType sessionType = SessionType.POMODORO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public FocusSession() {}

    public FocusSession(
            User user,
            Task task,
            LearningTopic learningTopic,
            Instant startTime,
            Instant endTime,
            Integer durationMinutes,
            SessionType sessionType,
            String notes
    ) {
        this.user = user;
        this.task = task;
        this.learningTopic = learningTopic;
        this.startTime = startTime != null ? startTime : Instant.now();
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.sessionType = sessionType != null ? sessionType : SessionType.POMODORO;
        this.notes = notes;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public LearningTopic getLearningTopic() { return learningTopic; }
    public void setLearningTopic(LearningTopic learningTopic) { this.learningTopic = learningTopic; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public SessionType getSessionType() { return sessionType; }
    public void setSessionType(SessionType sessionType) { this.sessionType = sessionType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
}
