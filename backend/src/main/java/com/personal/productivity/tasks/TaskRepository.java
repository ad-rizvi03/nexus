package com.personal.productivity.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    Optional<Task> findByIdAndUserId(UUID id, UUID userId);

    List<Task> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category LEFT JOIN FETCH t.subtasks WHERE t.user.id = :userId AND t.plannedDate = :plannedDate ORDER BY t.priority DESC, t.createdAt ASC")
    List<Task> findByUserIdAndPlannedDate(@Param("userId") UUID userId, @Param("plannedDate") LocalDate plannedDate);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category LEFT JOIN FETCH t.subtasks WHERE t.user.id = :userId AND t.deadlineDate < :currentDate AND t.status != 'COMPLETED' ORDER BY t.deadlineDate ASC")
    List<Task> findOverdueTasks(@Param("userId") UUID userId, @Param("currentDate") LocalDate currentDate);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category LEFT JOIN FETCH t.subtasks WHERE t.user.id = :userId AND t.status = 'IN_PROGRESS' ORDER BY t.updatedAt DESC")
    List<Task> findInProgressTasks(@Param("userId") UUID userId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category LEFT JOIN FETCH t.subtasks WHERE t.id = :id AND t.user.id = :userId")
    Optional<Task> findWithDetailsByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId AND t.plannedDate BETWEEN :startDate AND :endDate ORDER BY t.plannedDate ASC")
    List<Task> findByUserIdAndPlannedDateBetween(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId AND t.deadlineDate BETWEEN :startDate AND :endDate ORDER BY t.deadlineDate ASC")
    List<Task> findByUserIdAndDeadlineDateBetween(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    long countByGoalId(UUID goalId);

    long countByGoalIdAndStatus(UUID goalId, TaskStatus status);

    List<Task> findByGoalId(UUID goalId);
}
