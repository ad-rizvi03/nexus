package com.personal.productivity.learning;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningRoadmapRepository extends JpaRepository<LearningRoadmap, UUID> {
    @EntityGraph(attributePaths = {"modules"})
    List<LearningRoadmap> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    @EntityGraph(attributePaths = {"modules"})
    Optional<LearningRoadmap> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserId(UUID userId);
}
