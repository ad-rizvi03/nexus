package com.personal.productivity.tasks;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.tasks.dto.SubtaskDto;
import com.personal.productivity.tasks.dto.SubtaskRequest;
import com.personal.productivity.tasks.dto.TaskRequest;
import com.personal.productivity.tasks.dto.TaskResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;
    private final AuthService authService;

    public TaskController(TaskService taskService, AuthService authService) {
        this.taskService = taskService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "createdAt") String sort) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(taskService.getTasks(user, status, priority, categoryId, search, sort));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(taskService.createTask(user, request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(taskService.getTaskById(user, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable UUID id, @Valid @RequestBody TaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(taskService.updateTask(user, id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) TaskStatus status,
            @RequestBody(required = false) Map<String, String> statusUpdate) {
        User user = authService.getCurrentAuthenticatedUser();
        TaskStatus finalStatus = status;
        if (finalStatus == null && statusUpdate != null && statusUpdate.containsKey("status")) {
            finalStatus = TaskStatus.valueOf(statusUpdate.get("status").toUpperCase());
        }
        if (finalStatus == null) {
            throw new com.personal.productivity.common.BadRequestException("Status is required either as query parameter or request body");
        }
        return ResponseEntity.ok(taskService.updateTaskStatus(user, id, finalStatus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTask(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        taskService.deleteTask(user, id);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<SubtaskDto> addSubtask(
            @PathVariable UUID id,
            @Valid @RequestBody SubtaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(taskService.addSubtask(user, id, request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/subtasks/{subtaskId}/toggle")
    public ResponseEntity<SubtaskDto> toggleSubtask(
            @PathVariable UUID id,
            @PathVariable UUID subtaskId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(taskService.toggleSubtask(user, id, subtaskId));
    }

    @PutMapping("/{id}/subtasks/{subtaskId}")
    public ResponseEntity<SubtaskDto> updateSubtask(
            @PathVariable UUID id,
            @PathVariable UUID subtaskId,
            @Valid @RequestBody SubtaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(taskService.updateSubtask(user, id, subtaskId, request));
    }

    @DeleteMapping("/{id}/subtasks/{subtaskId}")
    public ResponseEntity<Map<String, String>> deleteSubtask(
            @PathVariable UUID id,
            @PathVariable UUID subtaskId) {
        User user = authService.getCurrentAuthenticatedUser();
        taskService.deleteSubtask(user, id, subtaskId);
        return ResponseEntity.ok(Map.of("message", "Subtask deleted successfully"));
    }
}
