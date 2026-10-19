package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.common.ResourceNotFoundException;
import com.personal.productivity.settings.UserSettings;
import com.personal.productivity.settings.UserSettingsRepository;
import com.personal.productivity.tasks.*;
import com.personal.productivity.tasks.dto.DashboardTodayResponse;
import com.personal.productivity.tasks.dto.TaskRequest;
import com.personal.productivity.tasks.dto.TaskResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SubtaskRepository subtaskRepository;

    @Mock
    private CategoryService categoryService;

    @Mock
    private UserSettingsRepository userSettingsRepository;

    private TaskService taskService;
    private User testUser;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, subtaskRepository, categoryService, userSettingsRepository);
        testUser = new User("test@local.dev", "hash", "Test User");
        testUser.setId(UUID.randomUUID());
    }

    @Test
    void createTask_Success() {
        TaskRequest request = new TaskRequest(
            "Implement Phase 2 Task API",
            "Build complete task CRUD",
            TaskStatus.TO_DO,
            TaskPriority.HIGH,
            null,
            LocalDate.of(2026, 10, 19),
            null, null, null, null,
            60,
            null
        );

        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse response = taskService.createTask(testUser, request);

        assertNotNull(response);
        assertEquals("Implement Phase 2 Task API", response.title());
        assertEquals(TaskStatus.TO_DO, response.status());
        assertEquals(TaskPriority.HIGH, response.priority());
        assertEquals(60, response.estimatedDurationMinutes());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void updateTaskStatus_Completed_SetsCompletedAt() {
        UUID taskId = UUID.randomUUID();
        Task existing = new Task(testUser, "Task 1", TaskPriority.MEDIUM, 45);
        existing.setId(taskId);
        existing.setStatus(TaskStatus.TO_DO);

        when(taskRepository.findByIdAndUserId(taskId, testUser.getId())).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.updateTaskStatus(testUser, taskId, TaskStatus.COMPLETED);

        assertEquals(TaskStatus.COMPLETED, response.status());
        assertNotNull(response.completedAt());
    }

    @Test
    void updateTaskStatus_Reopened_ClearsCompletedAt() {
        UUID taskId = UUID.randomUUID();
        Task existing = new Task(testUser, "Task 1", TaskPriority.MEDIUM, 45);
        existing.setId(taskId);
        existing.setStatus(TaskStatus.COMPLETED);

        when(taskRepository.findByIdAndUserId(taskId, testUser.getId())).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.updateTaskStatus(testUser, taskId, TaskStatus.IN_PROGRESS);

        assertEquals(TaskStatus.IN_PROGRESS, response.status());
        assertNull(response.completedAt());
    }

    @Test
    void getTaskById_EnforcesUserOwnership() {
        UUID otherUserId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        when(taskRepository.findWithDetailsByIdAndUserId(taskId, testUser.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTaskById(testUser, taskId));
    }

    @Test
    void getDashboardToday_CalculatesWorkloadAndCapacity() {
        LocalDate today = LocalDate.of(2026, 10, 19); // Monday (weekday)

        UserSettings settings = new UserSettings(testUser);
        settings.setWeekdayStudyHours(new BigDecimal("3.00")); // 180 min
        when(userSettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(settings));

        Task t1 = new Task(testUser, "Task 1", TaskPriority.HIGH, 60);
        t1.setStatus(TaskStatus.IN_PROGRESS);
        Task t2 = new Task(testUser, "Task 2", TaskPriority.MEDIUM, 90);
        t2.setStatus(TaskStatus.TO_DO);
        Task t3 = new Task(testUser, "Task 3 (Done)", TaskPriority.LOW, 30);
        t3.setStatus(TaskStatus.COMPLETED);

        when(taskRepository.findByUserIdAndPlannedDate(testUser.getId(), today)).thenReturn(List.of(t1, t2, t3));
        when(taskRepository.findOverdueTasks(testUser.getId(), today)).thenReturn(List.of());
        when(taskRepository.findInProgressTasks(testUser.getId())).thenReturn(List.of(t1));

        DashboardTodayResponse summary = taskService.getDashboardToday(testUser, today);

        assertNotNull(summary);
        assertEquals(3, summary.todayTasks().size());
        assertEquals(1, summary.completedCountToday());
        assertEquals(2, summary.activeCountToday());
        // Planned active: 60 + 90 = 150m. Completed task is excluded from active workload!
        assertEquals(150, summary.totalPlannedMinutesToday());
        assertEquals(180, summary.availableMinutesToday());
        assertEquals(30, summary.remainingCapacityMinutes());
        assertFalse(summary.isOverloaded());
    }
}
