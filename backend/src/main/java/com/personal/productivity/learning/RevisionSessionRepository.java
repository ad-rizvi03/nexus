package com.personal.productivity.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevisionSessionRepository extends JpaRepository<RevisionSession, UUID> {
    List<RevisionSession> findAllByUserIdAndCompletedFalseOrderByScheduledDateAsc(UUID userId);
    Optional<RevisionSession> findByIdAndUserId(UUID id, UUID userId);
    Optional<RevisionSession> findFirstByTopicModuleRoadmapIdAndCompletedFalseOrderByScheduledDateAsc(UUID roadmapId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM RevisionSession r JOIN FETCH r.topic t JOIN FETCH t.module m JOIN FETCH m.roadmap rm WHERE r.user.id = :userId AND r.scheduledDate BETWEEN :startDate AND :endDate ORDER BY r.scheduledDate ASC")
    List<RevisionSession> findByUserIdAndScheduledDateBetween(
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate);
}
