package com.personal.productivity.habits;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<Habit, UUID> {

    Optional<Habit> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT h FROM Habit h WHERE h.user.id = :userId ORDER BY h.isPaused ASC, h.createdAt ASC")
    List<Habit> findAllByUserId(@Param("userId") UUID userId);

    @Query("SELECT h FROM Habit h WHERE h.user.id = :userId AND h.isPaused = false ORDER BY h.createdAt ASC")
    List<Habit> findAllActiveByUserId(@Param("userId") UUID userId);

    boolean existsByUserId(UUID userId);
}
