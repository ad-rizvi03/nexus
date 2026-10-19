package com.personal.productivity.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningTopicRepository extends JpaRepository<LearningTopic, UUID> {
    List<LearningTopic> findAllByModuleIdOrderBySortOrderAsc(UUID moduleId);
    Optional<LearningTopic> findByIdAndModuleRoadmapUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(t) FROM LearningTopic t WHERE t.module.roadmap.id = :roadmapId")
    long countByRoadmapId(@Param("roadmapId") UUID roadmapId);

    @Query("SELECT COUNT(t) FROM LearningTopic t WHERE t.module.roadmap.id = :roadmapId AND t.status = 'COMPLETED'")
    long countCompletedByRoadmapId(@Param("roadmapId") UUID roadmapId);

    @Query("SELECT t FROM LearningTopic t JOIN FETCH t.module m JOIN FETCH m.roadmap r WHERE r.user.id = :userId AND t.status = 'COMPLETED' AND t.completedAt >= :start AND t.completedAt <= :end")
    List<LearningTopic> findCompletedByUserIdAndDateRange(@Param("userId") UUID userId, @Param("start") java.time.Instant start, @Param("end") java.time.Instant end);
}
