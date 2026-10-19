package com.personal.productivity.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyReviewRepository extends JpaRepository<DailyReview, UUID> {

    Optional<DailyReview> findByUserIdAndReviewDate(UUID userId, LocalDate reviewDate);

    List<DailyReview> findAllByUserIdOrderByReviewDateDesc(UUID userId);

    @Query("SELECT r FROM DailyReview r WHERE r.user.id = :userId AND r.reviewDate BETWEEN :startDate AND :endDate ORDER BY r.reviewDate ASC")
    List<DailyReview> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    boolean existsByUserIdAndReviewDate(UUID userId, LocalDate reviewDate);
}
