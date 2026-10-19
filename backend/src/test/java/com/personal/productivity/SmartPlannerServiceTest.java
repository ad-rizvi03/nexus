package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.planner.SmartPlannerService;
import com.personal.productivity.planner.dto.SmartPlanResponse;
import com.personal.productivity.settings.UserSettings;
import com.personal.productivity.settings.UserSettingsRepository;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskPriority;
import com.personal.productivity.tasks.TaskRepository;
import com.personal.productivity.tasks.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmartPlannerServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserSettingsRepository userSettingsRepository;

    @InjectMocks
    private SmartPlannerService plannerService;

    private User testUser;
    private UUID userId;
    private LocalDate targetDate;
    private UserSettings settings;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("engineer@example.com");

        targetDate = LocalDate.now();

        settings = new UserSettings();
        settings.setUser(testUser);
        settings.setWorkStartTime(LocalTime.of(9, 0));
        settings.setWorkEndTime(LocalTime.of(18, 0));
        settings.setCommuteMinutes(30);
        settings.setWeekdayStudyHours(new BigDecimal("2.00"));
        settings.setWeekendStudyHours(new BigDecimal("4.00"));
    }

    @Test
    void testGenerateDailyPlan_OptimalSchedule() {
        when(userSettingsRepository.findByUserId(userId)).thenReturn(Optional.of(settings));

        Task t1 = new Task();
        t1.setId(UUID.randomUUID());
        t1.setTitle("Urgent Bug Fix");
        t1.setPriority(TaskPriority.URGENT);
        t1.setStatus(TaskStatus.TO_DO);
        t1.setEstimatedDurationMinutes(60);

        Task t2 = new Task();
        t2.setId(UUID.randomUUID());
        t2.setTitle("Code Review");
        t2.setPriority(TaskPriority.MEDIUM);
        t2.setStatus(TaskStatus.TO_DO);
        t2.setEstimatedDurationMinutes(45);

        when(taskRepository.findByUserIdAndPlannedDate(userId, targetDate)).thenReturn(List.of(t1, t2));
        when(taskRepository.findOverdueTasks(userId, targetDate)).thenReturn(Collections.emptyList());

        SmartPlanResponse plan = plannerService.generateDailyPlan(userId, targetDate);

        assertNotNull(plan);
        assertEquals(2, plan.slots().size());
        assertEquals("Urgent Bug Fix", plan.slots().get(0).taskTitle());
        assertEquals(105, plan.totalPlannedDurationMinutes());
        assertEquals(0, plan.overloadMinutes());
        assertFalse(plan.slots().isEmpty());
    }

    @Test
    void testGenerateDailyPlan_OverloadDetection() {
        when(userSettingsRepository.findByUserId(userId)).thenReturn(Optional.of(settings));

        // Create tasks whose combined duration exceeds daily capacity
        Task heavy1 = new Task();
        heavy1.setId(UUID.randomUUID());
        heavy1.setTitle("Massive Architecture Refactor");
        heavy1.setPriority(TaskPriority.HIGH);
        heavy1.setStatus(TaskStatus.TO_DO);
        heavy1.setEstimatedDurationMinutes(600); // 10 hours

        Task heavy2 = new Task();
        heavy2.setId(UUID.randomUUID());
        heavy2.setTitle("Full Test Suite Rewrite");
        heavy2.setPriority(TaskPriority.MEDIUM);
        heavy2.setStatus(TaskStatus.TO_DO);
        heavy2.setEstimatedDurationMinutes(300); // 5 hours

        when(taskRepository.findByUserIdAndPlannedDate(userId, targetDate)).thenReturn(List.of(heavy1, heavy2));
        when(taskRepository.findOverdueTasks(userId, targetDate)).thenReturn(Collections.emptyList());

        SmartPlanResponse plan = plannerService.generateDailyPlan(userId, targetDate);

        assertNotNull(plan);
        assertEquals("OVERLOADED", plan.status());
        assertTrue(plan.overloadMinutes() > 0);
        assertTrue(plan.overallSummary().contains("Workload exceeds available time"));
    }
}
