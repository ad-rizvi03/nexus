package com.personal.productivity.goals;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoalMilestoneRepository extends JpaRepository<GoalMilestone, UUID> {

    List<GoalMilestone> findByGoalIdOrderBySortOrderAscCreatedAtAsc(UUID goalId);

    @Query("SELECT m FROM GoalMilestone m WHERE m.id = :id AND m.goal.user.id = :userId")
    Optional<GoalMilestone> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT m FROM GoalMilestone m WHERE m.id = :id AND m.goal.id = :goalId AND m.goal.user.id = :userId")
    Optional<GoalMilestone> findByIdAndGoalIdAndUserId(@Param("id") UUID id, @Param("goalId") UUID goalId, @Param("userId") UUID userId);

    @Query("SELECT m FROM GoalMilestone m JOIN FETCH m.goal g WHERE g.user.id = :userId AND m.completed = true AND m.completedAt >= :start AND m.completedAt <= :end")
    List<GoalMilestone> findCompletedByUserIdAndDateRange(@Param("userId") UUID userId, @Param("start") java.time.Instant start, @Param("end") java.time.Instant end);
}
