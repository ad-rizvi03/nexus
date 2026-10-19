package com.personal.productivity.goals;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    @Query("SELECT DISTINCT g FROM Goal g LEFT JOIN FETCH g.category LEFT JOIN FETCH g.milestones WHERE g.id = :id AND g.user.id = :userId")
    Optional<Goal> findByIdAndUserIdWithMilestones(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT g FROM Goal g LEFT JOIN FETCH g.category LEFT JOIN FETCH g.milestones WHERE g.user.id = :userId ORDER BY g.targetDate ASC NULLS LAST, g.createdAt DESC")
    List<Goal> findAllByUserIdWithMilestones(@Param("userId") UUID userId);

    boolean existsByUserId(UUID userId);
}
