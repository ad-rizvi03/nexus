package com.personal.productivity.notes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {
    Optional<Tag> findByUserIdAndName(UUID userId, String name);
    List<Tag> findAllByUserIdOrderByNameAsc(UUID userId);
}
