package com.personal.productivity.notes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedResourceRepository extends JpaRepository<SavedResource, UUID> {

    Optional<SavedResource> findByIdAndUserId(UUID id, UUID userId);

    List<SavedResource> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT r FROM SavedResource r WHERE r.user.id = :userId AND " +
            "(LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(r.description, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(r.url, '')) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY r.createdAt DESC")
    List<SavedResource> searchResources(@Param("userId") UUID userId, @Param("query") String query);

    List<SavedResource> findAllByUserIdAndResourceTypeOrderByCreatedAtDesc(UUID userId, ResourceType resourceType);

    boolean existsByUserId(UUID userId);
}
