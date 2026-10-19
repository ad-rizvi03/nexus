package com.personal.productivity.focus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    @Query("SELECT s FROM FocusSession s LEFT JOIN FETCH s.task LEFT JOIN FETCH s.learningTopic WHERE s.id = :id AND s.user.id = :userId")
    Optional<FocusSession> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT s FROM FocusSession s LEFT JOIN FETCH s.task LEFT JOIN FETCH s.learningTopic WHERE s.user.id = :userId AND s.endTime IS NULL ORDER BY s.startTime DESC")
    List<FocusSession> findAllActiveByUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM FocusSession s LEFT JOIN FETCH s.task LEFT JOIN FETCH s.learningTopic WHERE s.user.id = :userId ORDER BY s.startTime DESC")
    List<FocusSession> findAllByUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT s FROM FocusSession s LEFT JOIN FETCH s.task LEFT JOIN FETCH s.learningTopic WHERE s.user.id = :userId AND s.startTime >= :start AND s.startTime <= :end ORDER BY s.startTime DESC")
    List<FocusSession> findAllByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT COALESCE(SUM(s.durationMinutes), 0) FROM FocusSession s WHERE s.user.id = :userId AND s.endTime IS NOT NULL AND s.startTime >= :start AND s.startTime <= :end")
    int sumDurationMinutes(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

    boolean existsByUserId(UUID userId);
}
