package com.personal.productivity.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, UUID> {
    List<Subtask> findByTaskIdOrderBySortOrderAscCreatedAtAsc(UUID taskId);
    Optional<Subtask> findByIdAndTaskId(UUID id, UUID taskId);
}
