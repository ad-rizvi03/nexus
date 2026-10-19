package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.focus.FocusSessionRepository;
import com.personal.productivity.goals.GoalMilestone;
import com.personal.productivity.goals.GoalMilestoneRepository;
import com.personal.productivity.habits.Habit;
import com.personal.productivity.habits.HabitEntry;
import com.personal.productivity.habits.HabitEntryRepository;
import com.personal.productivity.learning.LearningTopic;
import com.personal.productivity.learning.LearningTopicRepository;
import com.personal.productivity.review.DailyReview;
import com.personal.productivity.review.DailyReviewRepository;
import com.personal.productivity.review.DailyReviewService;
import com.personal.productivity.review.dto.*;
import com.personal.productivity.tasks.*;
import com.personal.productivity.tasks.dto.TaskResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyReviewServiceTest {

    @Mock
    private DailyReviewRepository dailyReviewRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SubtaskRepository subtaskRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private LearningTopicRepository learningTopicRepository;

    @Mock
    private GoalMilestoneRepository goalMilestoneRepository;

    @Mock
    private HabitEntryRepository habitEntryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DailyReviewService dailyReviewService;

    private User testUser;
    private UUID userId;
    private LocalDate today;
    private Task unfinishedTask;
    private Task completedTask;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("engineer@example.com");

        today = LocalDate.now();

        unfinishedTask = new Task();
        unfinishedTask.setId(UUID.randomUUID());
        unfinishedTask.setUser(testUser);
        unfinishedTask.setTitle("Implement Raft Leader Election");
        unfinishedTask.setStatus(TaskStatus.TO_DO);
        unfinishedTask.setPriority(TaskPriority.HIGH);
        unfinishedTask.setPlannedDate(today);
        unfinishedTask.setSubtasks(new ArrayList<>());

        completedTask = new Task();
        completedTask.setId(UUID.randomUUID());
        completedTask.setUser(testUser);
        completedTask.setTitle("Read MVCC paper");
        completedTask.setStatus(TaskStatus.COMPLETED);
        completedTask.setPriority(TaskPriority.MEDIUM);
        completedTask.setPlannedDate(today);
        completedTask.setCompletedAt(Instant.now());
        completedTask.setSubtasks(new ArrayList<>());
    }

    @Test
    void testGetDailyReviewWorkspace_AggregatesLiveData() {
        when(taskRepository.findCompletedForDate(eq(userId), eq(today), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(completedTask));
        when(taskRepository.findUnfinishedForReview(eq(userId), eq(today)))
                .thenReturn(List.of(unfinishedTask));
        when(taskRepository.findMissedDeadlinesForReview(eq(userId), eq(today)))
                .thenReturn(Collections.emptyList());
        when(focusSessionRepository.sumDurationMinutes(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(90);
        when(learningTopicRepository.findCompletedByUserIdAndDateRange(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(goalMilestoneRepository.findCompletedByUserIdAndDateRange(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        Habit habit = new Habit(testUser, "Morning Routine", "Consistency habit", com.personal.productivity.habits.HabitFrequency.DAILY, 20);
        HabitEntry entry = new HabitEntry(habit, today, true, 20, "Completed morning routine");
        when(habitEntryRepository.findAllByUserIdAndDateRange(userId, today, today))
                .thenReturn(List.of(entry));

        when(dailyReviewRepository.findByUserIdAndReviewDate(userId, today))
                .thenReturn(Optional.empty());

        DailyReviewWorkspaceDto workspace = dailyReviewService.getDailyReviewWorkspace(userId, today);

        assertNotNull(workspace);
        assertEquals(today, workspace.reviewDate());
        assertFalse(workspace.completed());
        assertEquals(1, workspace.totalCompletedTasks());
        assertEquals(1, workspace.totalUnfinishedTasks());
        assertEquals(0, workspace.totalMissedDeadlines());
        assertEquals(90, workspace.timeTrackedMinutes());
        assertEquals(1, workspace.habitsCompletedCount());
    }

    @Test
    void testExecuteTriage_Reschedule() {
        when(taskRepository.findWithDetailsByIdAndUserId(unfinishedTask.getId(), userId))
                .thenReturn(Optional.of(unfinishedTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDate tomorrow = today.plusDays(1);
        LocalTime startTime = LocalTime.of(10, 0);
        TaskTriageRequest request = new TaskTriageRequest(
                unfinishedTask.getId(),
                TaskTriageAction.RESCHEDULE,
                tomorrow,
                startTime,
                null,
                null
        );

        TaskResponse response = dailyReviewService.executeTriage(userId, request);

        assertNotNull(response);
        assertEquals(tomorrow, unfinishedTask.getPlannedDate());
        assertEquals(startTime, unfinishedTask.getStartTime());
        verify(taskRepository).save(unfinishedTask);
    }

    @Test
    void testExecuteTriage_Backlog() {
        when(taskRepository.findWithDetailsByIdAndUserId(unfinishedTask.getId(), userId))
                .thenReturn(Optional.of(unfinishedTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskTriageRequest request = new TaskTriageRequest(
                unfinishedTask.getId(),
                TaskTriageAction.BACKLOG,
                null,
                null,
                null,
                null
        );

        TaskResponse response = dailyReviewService.executeTriage(userId, request);

        assertNotNull(response);
        assertNull(unfinishedTask.getPlannedDate());
        assertNull(unfinishedTask.getStartTime());
        verify(taskRepository).save(unfinishedTask);
    }

    @Test
    void testExecuteTriage_MarkBlocked() {
        when(taskRepository.findWithDetailsByIdAndUserId(unfinishedTask.getId(), userId))
                .thenReturn(Optional.of(unfinishedTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskTriageRequest request = new TaskTriageRequest(
                unfinishedTask.getId(),
                TaskTriageAction.MARK_BLOCKED,
                null,
                null,
                "Waiting on security review sign-off",
                null
        );

        dailyReviewService.executeTriage(userId, request);

        assertEquals(TaskStatus.BLOCKED, unfinishedTask.getStatus());
        assertTrue(unfinishedTask.getDescription().contains("Waiting on security review sign-off"));
        verify(taskRepository).save(unfinishedTask);
    }

    @Test
    void testExecuteTriage_BreakSubtasks() {
        when(taskRepository.findWithDetailsByIdAndUserId(unfinishedTask.getId(), userId))
                .thenReturn(Optional.of(unfinishedTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<String> subtasks = List.of("Define RPC messages", "Implement heartbeat timer", "Add test cases");
        TaskTriageRequest request = new TaskTriageRequest(
                unfinishedTask.getId(),
                TaskTriageAction.BREAK_SUBTASKS,
                null,
                null,
                null,
                subtasks
        );

        dailyReviewService.executeTriage(userId, request);

        assertEquals(TaskStatus.IN_PROGRESS, unfinishedTask.getStatus());
        assertEquals(3, unfinishedTask.getSubtasks().size());
        verify(subtaskRepository, times(3)).save(any(Subtask.class));
        verify(taskRepository).save(unfinishedTask);
    }

    @Test
    void testExecuteTriage_Cancel() {
        when(taskRepository.findWithDetailsByIdAndUserId(unfinishedTask.getId(), userId))
                .thenReturn(Optional.of(unfinishedTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskTriageRequest request = new TaskTriageRequest(
                unfinishedTask.getId(),
                TaskTriageAction.CANCEL,
                null,
                null,
                null,
                null
        );

        dailyReviewService.executeTriage(userId, request);

        assertEquals(TaskStatus.CANCELLED, unfinishedTask.getStatus());
        verify(taskRepository).save(unfinishedTask);
    }

    @Test
    void testSaveDailyReview_PersistsReviewRecord() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(dailyReviewRepository.findByUserIdAndReviewDate(userId, today))
                .thenReturn(Optional.empty());
        when(dailyReviewRepository.save(any(DailyReview.class))).thenAnswer(invocation -> {
            DailyReview r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        when(taskRepository.findCompletedForDate(eq(userId), eq(today), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(completedTask));
        when(taskRepository.findUnfinishedForReview(eq(userId), eq(today)))
                .thenReturn(Collections.emptyList());
        when(taskRepository.findMissedDeadlinesForReview(eq(userId), eq(today)))
                .thenReturn(Collections.emptyList());
        when(focusSessionRepository.sumDurationMinutes(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(120);
        when(learningTopicRepository.findCompletedByUserIdAndDateRange(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(goalMilestoneRepository.findCompletedByUserIdAndDateRange(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(habitEntryRepository.findAllByUserIdAndDateRange(userId, today, today))
                .thenReturn(Collections.emptyList());

        DailyReviewSubmissionDto submission = new DailyReviewSubmissionDto(
                today,
                "Strong velocity on distributed systems; need earlier start tomorrow.",
                Collections.emptyList()
        );

        DailyReviewDto saved = dailyReviewService.saveDailyReview(userId, submission);

        assertNotNull(saved);
        assertEquals(today, saved.reviewDate());
        assertEquals("COMPLETED", saved.status());
        assertEquals(1, saved.completedTaskCount());
        assertEquals(0, saved.unfinishedTaskCount());
        assertEquals(120, saved.totalTimeTrackedMinutes());
        assertEquals("Strong velocity on distributed systems; need earlier start tomorrow.", saved.reflectionNotes());

        verify(dailyReviewRepository).save(any(DailyReview.class));
    }
}
