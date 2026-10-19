package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.goals.*;
import com.personal.productivity.goals.dto.GoalDto;
import com.personal.productivity.goals.dto.GoalMilestoneDto;
import com.personal.productivity.tasks.Category;
import com.personal.productivity.tasks.CategoryRepository;
import com.personal.productivity.tasks.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private GoalMilestoneRepository milestoneRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GoalService goalService;

    private User testUser;
    private Category testCategory;
    private Goal testGoal;
    private GoalMilestone milestone1;
    private GoalMilestone milestone2;

    @BeforeEach
    void setUp() {
        testUser = new User("adnan@example.com", "hashed_pwd", "Adnan");
        testUser.setId(UUID.randomUUID());

        testCategory = new Category(testUser, "Learning", "#C6A56A", "book", 1);
        testCategory.setId(UUID.randomUUID());

        testGoal = new Goal(
                testUser,
                "Master Kubernetes & Cloud Native",
                "CKA certification prep",
                testCategory,
                LocalDate.now().plusDays(30),
                GoalStatus.IN_PROGRESS
        );
        testGoal.setId(UUID.randomUUID());

        milestone1 = new GoalMilestone(testGoal, "Setup Cluster", LocalDate.now().minusDays(5), true, 1);
        milestone1.setId(UUID.randomUUID());

        milestone2 = new GoalMilestone(testGoal, "Master Networking", LocalDate.now().plusDays(10), false, 2);
        milestone2.setId(UUID.randomUUID());

        testGoal.getMilestones().add(milestone1);
        testGoal.getMilestones().add(milestone2);
        testGoal.setProgressPercentage(50);
    }

    @Test
    void testCreateGoalWithMilestones() {
        GoalDto.Request req = new GoalDto.Request(
                "Pass CKA Exam",
                "Certification goal",
                testCategory.getId(),
                LocalDate.now().plusDays(40),
                GoalStatus.IN_PROGRESS,
                "Review weekly",
                List.of(
                        new GoalMilestoneDto.Request("Finish Mock Exam 1", LocalDate.now().plusDays(10), true, 1),
                        new GoalMilestoneDto.Request("Finish Mock Exam 2", LocalDate.now().plusDays(20), false, 2)
                )
        );

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(categoryRepository.findByIdAndUserId(testCategory.getId(), testUser.getId()))
                .thenReturn(Optional.of(testCategory));

        when(goalRepository.save(any(Goal.class))).thenAnswer(inv -> {
            Goal g = inv.getArgument(0);
            if (g.getId() == null) g.setId(UUID.randomUUID());
            return g;
        });

        GoalDto.Response response = goalService.createGoal(testUser.getId(), req);

        assertNotNull(response);
        assertEquals("Pass CKA Exam", response.name());
        assertEquals(50, response.progressPercentage());
        assertEquals(2, response.totalMilestones());
        assertEquals(1, response.completedMilestones());
        assertEquals(ScheduleHealth.ON_TRACK, response.scheduleHealth());
        verify(goalRepository).save(any(Goal.class));
    }

    @Test
    void testToggleMilestoneRecalculatesProgressAndCompletesGoal() {
        when(goalRepository.findByIdAndUserIdWithMilestones(testGoal.getId(), testUser.getId()))
                .thenReturn(Optional.of(testGoal));
        when(goalRepository.save(any(Goal.class))).thenAnswer(inv -> inv.getArgument(0));

        // Milestone 2 is currently false. Toggling it should make it true -> 2/2 = 100% -> status becomes COMPLETED
        GoalDto.Response updated = goalService.toggleMilestone(testUser.getId(), testGoal.getId(), milestone2.getId());

        assertNotNull(updated);
        assertEquals(100, updated.progressPercentage());
        assertEquals(GoalStatus.COMPLETED, updated.status());
        assertEquals(ScheduleHealth.COMPLETED, updated.scheduleHealth());
    }

    @Test
    void testScheduleHealthCalculation() {
        // Goal overdue
        testGoal.setTargetDate(LocalDate.now().minusDays(2));
        testGoal.setStatus(GoalStatus.IN_PROGRESS);

        when(goalRepository.findByIdAndUserIdWithMilestones(testGoal.getId(), testUser.getId()))
                .thenReturn(Optional.of(testGoal));

        GoalDto.Response resp = goalService.getGoalById(testUser.getId(), testGoal.getId());
        assertEquals(ScheduleHealth.OVERDUE, resp.scheduleHealth());

        // Approaching deadline (within 7 days)
        testGoal.setTargetDate(LocalDate.now().plusDays(4));
        GoalDto.Response resp2 = goalService.getGoalById(testUser.getId(), testGoal.getId());
        assertEquals(ScheduleHealth.APPROACHING_DEADLINE, resp2.scheduleHealth());
    }

    @Test
    void testGetGoalsSummary() {
        when(goalRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(goalRepository.findAllByUserIdWithMilestones(testUser.getId())).thenReturn(List.of(testGoal));

        GoalDto.SummaryResponse summary = goalService.getGoalsSummary(testUser.getId());

        assertNotNull(summary);
        assertEquals(1, summary.totalGoals());
        assertEquals(1, summary.inProgressGoals());
        assertEquals(50.0, summary.averageProgress());
    }
}
