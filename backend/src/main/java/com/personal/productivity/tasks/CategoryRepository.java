package com.personal.productivity.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserIdOrderBySortOrderAscNameAsc(UUID userId);
    Optional<Category> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);
}
