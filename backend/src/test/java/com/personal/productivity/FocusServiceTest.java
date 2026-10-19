package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.focus.*;
import com.personal.productivity.focus.dto.FocusSessionDto;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskPriority;
import com.personal.productivity.tasks.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FocusServiceTest {

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FocusService focusService;

    private User testUser;
    private Task testTask;
    private FocusSession activeSession;

    @BeforeEach
    void setUp() {
        testUser = new User("adnan@example.com", "hashed_pwd", "Adnan");
        testUser.setId(UUID.randomUUID());

        testTask = new Task(testUser, "Implement Distributed Cache", TaskPriority.HIGH, 60);
        testTask.setId(UUID.randomUUID());

        activeSession = new FocusSession(
                testUser,
                testTask,
                null,
                Instant.now().minus(20, ChronoUnit.MINUTES),
                null,
                null,
                SessionType.POMODORO,
                "Focus block in progress"
        );
        activeSession.setId(UUID.randomUUID());
    }

    @Test
    void testStartSessionClosesExistingActiveAndStartsNew() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(focusSessionRepository.findAllActiveByUserId(testUser.getId())).thenReturn(List.of(activeSession));
        when(taskRepository.findByIdAndUserId(testTask.getId(), testUser.getId())).thenReturn(Optional.of(testTask));

        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(inv -> {
            FocusSession s = inv.getArgument(0);
            if (s.getId() == null) s.setId(UUID.randomUUID());
            return s;
        });

        FocusSessionDto.StartRequest req = new FocusSessionDto.StartRequest(
                testTask.getId(),
                null,
                SessionType.POMODORO,
                "New sprint focus"
        );

        FocusSessionDto.Response response = focusService.startSession(testUser.getId(), req);

        assertNotNull(response);
        assertTrue(response.isRunning());
        assertEquals("Implement Distributed Cache", response.taskTitle());
        assertNotNull(activeSession.getEndTime()); // Prior session was closed
        verify(focusSessionRepository, atLeast(2)).save(any(FocusSession.class));
    }

    @Test
    void testStopSessionCalculatesDuration() {
        when(focusSessionRepository.findByIdAndUserId(activeSession.getId(), testUser.getId()))
                .thenReturn(Optional.of(activeSession));
        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(inv -> inv.getArgument(0));

        FocusSessionDto.StopRequest stopReq = new FocusSessionDto.StopRequest(25, "Completed 25m pomodoro");
        FocusSessionDto.Response stopped = focusService.stopSession(testUser.getId(), activeSession.getId(), stopReq);

        assertNotNull(stopped);
        assertFalse(stopped.isRunning());
        assertEquals(25, stopped.durationMinutes());
        assertEquals("Completed 25m pomodoro", stopped.notes());
    }

    @Test
    void testCreateManualEntry() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(taskRepository.findByIdAndUserId(testTask.getId(), testUser.getId())).thenReturn(Optional.of(testTask));
        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(inv -> {
            FocusSession s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        FocusSessionDto.ManualRequest manualReq = new FocusSessionDto.ManualRequest(
                testTask.getId(),
                null,
                Instant.now().minus(60, ChronoUnit.MINUTES),
                45,
                SessionType.MANUAL,
                "Logged 45 min offline reading"
        );

        FocusSessionDto.Response response = focusService.createManualEntry(testUser.getId(), manualReq);

        assertNotNull(response);
        assertFalse(response.isRunning());
        assertEquals(45, response.durationMinutes());
        assertEquals(SessionType.MANUAL, response.sessionType());
        verify(focusSessionRepository).save(any(FocusSession.class));
    }

    @Test
    void testGetSummary() {
        when(focusSessionRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(focusSessionRepository.sumDurationMinutes(eq(testUser.getId()), any(), any())).thenReturn(75);
        when(focusSessionRepository.findAllByUserIdWithDetails(testUser.getId())).thenReturn(List.of(activeSession));
        when(focusSessionRepository.findAllActiveByUserId(testUser.getId())).thenReturn(List.of(activeSession));

        FocusSessionDto.SummaryResponse summary = focusService.getSummary(testUser.getId());

        assertNotNull(summary);
        assertNotNull(summary.activeSession());
        assertEquals(75, summary.todayFocusMinutes());
        assertEquals(1, summary.recentSessions().size());
    }
}
