package com.personal.productivity.notes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    @Query("SELECT DISTINCT n FROM Note n LEFT JOIN FETCH n.category LEFT JOIN FETCH n.tags WHERE n.id = :id AND n.user.id = :userId")
    Optional<Note> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    boolean existsByUserId(UUID userId);

    @Query("SELECT DISTINCT n FROM Note n LEFT JOIN FETCH n.category LEFT JOIN FETCH n.tags WHERE n.user.id = :userId ORDER BY n.isPinned DESC, n.updatedAt DESC")
    List<Note> findAllByUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT n FROM Note n LEFT JOIN FETCH n.category LEFT JOIN FETCH n.tags WHERE n.user.id = :userId AND " +
            "(LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY n.isPinned DESC, n.updatedAt DESC")
    List<Note> searchNotes(@Param("userId") UUID userId, @Param("query") String query);

    @Query("SELECT DISTINCT n FROM Note n LEFT JOIN FETCH n.category LEFT JOIN FETCH n.tags WHERE n.user.id = :userId AND n.category.id = :categoryId ORDER BY n.isPinned DESC, n.updatedAt DESC")
    List<Note> findAllByUserIdAndCategoryId(@Param("userId") UUID userId, @Param("categoryId") UUID categoryId);
}
