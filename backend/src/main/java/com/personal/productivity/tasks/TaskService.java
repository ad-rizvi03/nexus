package com.personal.productivity.tasks;

import com.personal.productivity.auth.User;
import com.personal.productivity.common.ResourceNotFoundException;
import com.personal.productivity.settings.UserSettings;
import com.personal.productivity.settings.UserSettingsRepository;
import com.personal.productivity.tasks.dto.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final CategoryService categoryService;
    private final UserSettingsRepository userSettingsRepository;

    public TaskService(TaskRepository taskRepository,
                       SubtaskRepository subtaskRepository,
                       CategoryService categoryService,
                       UserSettingsRepository userSettingsRepository) {
        this.taskRepository = taskRepository;
        this.subtaskRepository = subtaskRepository;
        this.categoryService = categoryService;
        this.userSettingsRepository = userSettingsRepository;
    }

    @Transactional
    public TaskResponse createTask(User user, TaskRequest request) {
        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : TaskStatus.TO_DO);
        task.setPriority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM);
        task.setPlannedDate(request.plannedDate());
        task.setStartTime(request.startTime());
        task.setEndTime(request.endTime());
        task.setDeadlineDate(request.deadlineDate());
        task.setDeadlineTime(request.deadlineTime());
        task.setEstimatedDurationMinutes(request.estimatedDurationMinutes() != null ? request.estimatedDurationMinutes() : 45);
        task.setRecurrenceRule(request.recurrenceRule());

        if (request.categoryId() != null) {
            Category category = categoryService.getCategoryEntity(user, request.categoryId());
            task.setCategory(category);
        }

        task = taskRepository.save(task);
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse updateTask(User user, UUID id, TaskRequest request) {
        Task task = getTaskEntity(user, id);

        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        task.setPlannedDate(request.plannedDate());
        task.setStartTime(request.startTime());
        task.setEndTime(request.endTime());
        task.setDeadlineDate(request.deadlineDate());
        task.setDeadlineTime(request.deadlineTime());
        if (request.estimatedDurationMinutes() != null) {
            task.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        }
        task.setRecurrenceRule(request.recurrenceRule());

        if (request.categoryId() != null) {
            Category category = categoryService.getCategoryEntity(user, request.categoryId());
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }

        task = taskRepository.save(task);
        return TaskResponse.fromEntity(task);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(User user, UUID id) {
        Task task = taskRepository.findWithDetailsByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        return TaskResponse.fromEntity(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(User user, TaskStatus status, TaskPriority priority, UUID categoryId, String search, String sort) {
        Specification<Task> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), user.getId());

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (priority != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
            ));
        }

        List<Task> tasks = taskRepository.findAll(spec);

        // Sort results
        if ("plannedDate".equalsIgnoreCase(sort)) {
            tasks.sort(Comparator.comparing(Task::getPlannedDate, Comparator.nullsLast(Comparator.naturalOrder())));
        } else if ("deadlineDate".equalsIgnoreCase(sort)) {
            tasks.sort(Comparator.comparing(Task::getDeadlineDate, Comparator.nullsLast(Comparator.naturalOrder())));
        } else if ("priority".equalsIgnoreCase(sort)) {
            tasks.sort(Comparator.comparing(Task::getPriority).reversed());
        } else {
            tasks.sort(Comparator.comparing(Task::getCreatedAt).reversed());
        }

        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    @Transactional
    public TaskResponse updateTaskStatus(User user, UUID id, TaskStatus status) {
        Task task = getTaskEntity(user, id);
        task.setStatus(status);
        task = taskRepository.save(task);
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public void deleteTask(User user, UUID id) {
        Task task = getTaskEntity(user, id);
        taskRepository.delete(task);
    }

    @Transactional
    public SubtaskDto addSubtask(User user, UUID taskId, SubtaskRequest request) {
        Task task = getTaskEntity(user, taskId);
        int sortOrder = request.sortOrder() != null ? request.sortOrder() : task.getSubtasks().size() + 1;
        Subtask subtask = new Subtask(task, request.title().trim(), request.estimatedDurationMinutes(), sortOrder);
        subtask = subtaskRepository.save(subtask);
        return SubtaskDto.fromEntity(subtask);
    }

    @Transactional
    public SubtaskDto toggleSubtask(User user, UUID taskId, UUID subtaskId) {
        // Enforce user ownership of parent task
        getTaskEntity(user, taskId);
        Subtask subtask = subtaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        subtask.setCompleted(!subtask.isCompleted());
        subtask = subtaskRepository.save(subtask);
        return SubtaskDto.fromEntity(subtask);
    }

    @Transactional
    public void deleteSubtask(User user, UUID taskId, UUID subtaskId) {
        getTaskEntity(user, taskId);
        Subtask subtask = subtaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        subtaskRepository.delete(subtask);
    }

    @Transactional(readOnly = true)
    public DashboardTodayResponse getDashboardToday(User user, LocalDate currentDate) {
        LocalDate date = currentDate != null ? currentDate : LocalDate.now();

        List<Task> todayTasks = taskRepository.findByUserIdAndPlannedDate(user.getId(), date);
        List<Task> overdueTasks = taskRepository.findOverdueTasks(user.getId(), date);
        List<Task> inProgressTasks = taskRepository.findInProgressTasks(user.getId());

        // Calculate workload capacity based on user settings
        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElse(null);

        int availableMinutes = 240; // fallback 4 hours
        if (settings != null) {
            boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);
            BigDecimal targetHours = isWeekend ? settings.getWeekendStudyHours() : settings.getWeekdayStudyHours();
            availableMinutes = (int) (targetHours.doubleValue() * 60.0);
        }

        int plannedMinutesToday = todayTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                .mapToInt(t -> t.getEstimatedDurationMinutes() != null ? t.getEstimatedDurationMinutes() : 45)
                .sum();

        int remainingCapacity = Math.max(0, availableMinutes - plannedMinutesToday);
        boolean isOverloaded = plannedMinutesToday > availableMinutes;

        int completedCount = (int) todayTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        int activeCount = todayTasks.size() - completedCount;

        return new DashboardTodayResponse(
            todayTasks.stream().map(TaskResponse::fromEntity).toList(),
            overdueTasks.stream().map(TaskResponse::fromEntity).toList(),
            inProgressTasks.stream().map(TaskResponse::fromEntity).toList(),
            plannedMinutesToday,
            availableMinutes,
            remainingCapacity,
            isOverloaded,
            completedCount,
            activeCount
        );
    }

    public Task getTaskEntity(User user, UUID id) {
        return taskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }
}
