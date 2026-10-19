package com.personal.productivity.reminders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    @Query("SELECT r FROM Reminder r LEFT JOIN FETCH r.task WHERE r.user.id = :userId ORDER BY r.scheduledAt DESC")
    List<Reminder> findAllByUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT r FROM Reminder r LEFT JOIN FETCH r.task LEFT JOIN FETCH r.user WHERE r.status = :status AND r.scheduledAt <= :scheduledAt ORDER BY r.scheduledAt ASC")
    List<Reminder> findDueRemindersWithDetails(
            @Param("status") ReminderStatus status,
            @Param("scheduledAt") Instant scheduledAt);

    List<Reminder> findByTaskId(UUID taskId);

    Optional<Reminder> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndTaskIdAndNotificationTypeAndStatus(
            UUID userId, UUID taskId, NotificationType notificationType, ReminderStatus status);
}
