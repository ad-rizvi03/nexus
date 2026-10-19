package com.personal.productivity.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningModuleRepository extends JpaRepository<LearningModule, UUID> {
    List<LearningModule> findAllByRoadmapIdOrderBySortOrderAsc(UUID roadmapId);
    Optional<LearningModule> findByIdAndRoadmapUserId(UUID id, UUID userId);
}
