package com.personal.productivity.learning;

import com.personal.productivity.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "practice_logs")
public class PracticeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "roadmap_id")
    private UUID roadmapId;

    @Column(name = "topic_id")
    private UUID topicId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "problems_solved", nullable = false)
    private Integer problemsSolved = 0;

    @Column(name = "minutes_spent", nullable = false)
    private Integer minutesSpent = 0;

    @Column(name = "concept_summary", columnDefinition = "TEXT")
    private String conceptSummary;

    @Column(name = "mistakes_and_notes", columnDefinition = "TEXT")
    private String mistakesAndNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PracticeLog() {}

    public PracticeLog(User user, UUID roadmapId, UUID topicId, LocalDate logDate,
                       Integer problemsSolved, Integer minutesSpent,
                       String conceptSummary, String mistakesAndNotes) {
        this.user = user;
        this.roadmapId = roadmapId;
        this.topicId = topicId;
        this.logDate = logDate != null ? logDate : LocalDate.now();
        this.problemsSolved = problemsSolved != null ? problemsSolved : 0;
        this.minutesSpent = minutesSpent != null ? minutesSpent : 0;
        this.conceptSummary = conceptSummary;
        this.mistakesAndNotes = mistakesAndNotes;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public UUID getRoadmapId() { return roadmapId; }
    public void setRoadmapId(UUID roadmapId) { this.roadmapId = roadmapId; }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }

    public Integer getProblemsSolved() { return problemsSolved; }
    public void setProblemsSolved(Integer problemsSolved) { this.problemsSolved = problemsSolved; }

    public Integer getMinutesSpent() { return minutesSpent; }
    public void setMinutesSpent(Integer minutesSpent) { this.minutesSpent = minutesSpent; }

    public String getConceptSummary() { return conceptSummary; }
    public void setConceptSummary(String conceptSummary) { this.conceptSummary = conceptSummary; }

    public String getMistakesAndNotes() { return mistakesAndNotes; }
    public void setMistakesAndNotes(String mistakesAndNotes) { this.mistakesAndNotes = mistakesAndNotes; }

    public Instant getCreatedAt() { return createdAt; }
}
