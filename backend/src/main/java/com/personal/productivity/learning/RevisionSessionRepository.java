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
}
