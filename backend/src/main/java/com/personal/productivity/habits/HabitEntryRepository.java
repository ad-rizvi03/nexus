package com.personal.productivity.habits;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitEntryRepository extends JpaRepository<HabitEntry, UUID> {

    Optional<HabitEntry> findByHabitIdAndEntryDate(UUID habitId, LocalDate entryDate);

    List<HabitEntry> findAllByHabitIdAndEntryDateBetweenOrderByEntryDateAsc(UUID habitId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT e FROM HabitEntry e WHERE e.habit.user.id = :userId AND e.entryDate BETWEEN :startDate AND :endDate ORDER BY e.entryDate Asc")
    List<HabitEntry> findAllByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    List<HabitEntry> findAllByHabitIdOrderByEntryDateAsc(UUID habitId);

    void deleteByHabitIdAndEntryDate(UUID habitId, LocalDate entryDate);
}
