package com.personal.productivity.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PracticeLogRepository extends JpaRepository<PracticeLog, UUID> {
    List<PracticeLog> findAllByUserIdOrderByLogDateDescCreatedAtDesc(UUID userId);
    List<PracticeLog> findAllByUserIdAndRoadmapIdOrderByLogDateDescCreatedAtDesc(UUID userId, UUID roadmapId);

    @Query("SELECT COALESCE(SUM(p.minutesSpent), 0) FROM PracticeLog p WHERE p.user.id = :userId AND p.roadmapId = :roadmapId")
    long sumMinutesByRoadmapId(@Param("userId") UUID userId, @Param("roadmapId") UUID roadmapId);

    @Query("SELECT COALESCE(SUM(p.minutesSpent), 0) FROM PracticeLog p WHERE p.user.id = :userId")
    long sumAllMinutesByUserId(@Param("userId") UUID userId);
}
