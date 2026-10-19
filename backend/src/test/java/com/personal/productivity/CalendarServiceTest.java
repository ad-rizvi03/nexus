package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.calendar.CalendarService;
import com.personal.productivity.calendar.dto.CalendarEventDto;
import com.personal.productivity.learning.*;
import com.personal.productivity.tasks.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private RevisionSessionRepository revisionRepository;

    @InjectMocks
    private CalendarService calendarService;

    private User testUser;
    private Task plannedTask;
    private Task deadlineTask;
    private RevisionSession revisionSession;

    @BeforeEach
    void setUp() {
        testUser = new User("adnan@example.com", "hashed_pwd", "Adnan");
        testUser.setId(UUID.randomUUID());

        plannedTask = new Task(testUser, "Implement Calendar View", TaskPriority.HIGH, 60);
        plannedTask.setId(UUID.randomUUID());
        plannedTask.setPlannedDate(LocalDate.now());
        plannedTask.setStartTime(LocalTime.of(10, 0));

        deadlineTask = new Task(testUser, "Submit Architecture Review", TaskPriority.URGENT, 30);
        deadlineTask.setId(UUID.randomUUID());
        deadlineTask.setDeadlineDate(LocalDate.now().plusDays(2));
        deadlineTask.setDeadlineTime(LocalTime.of(18, 0));

        LearningRoadmap roadmap = new LearningRoadmap(testUser, "Java Concurrency", "Objective", LocalDate.now(), LocalDate.now().plusMonths(1), BigDecimal.valueOf(5.0));
        LearningModule module = new LearningModule(roadmap, "Loom", "Virtual Threads", 1);
        LearningTopic topic = new LearningTopic(module, "Virtual Threads", 45, 1);
        revisionSession = new RevisionSession(testUser, topic, LocalDate.now().plusDays(1), "Spaced repetition");
        revisionSession.setId(UUID.randomUUID());
    }

    @Test
    void testGetEventsAggregatesAllTypes() {
        LocalDate start = LocalDate.now().minusDays(1);
        LocalDate end = LocalDate.now().plusDays(5);

        when(taskRepository.findByUserIdAndPlannedDateBetween(testUser.getId(), start, end))
                .thenReturn(List.of(plannedTask));
        when(taskRepository.findByUserIdAndDeadlineDateBetween(testUser.getId(), start, end))
                .thenReturn(List.of(deadlineTask));
        when(revisionRepository.findByUserIdAndScheduledDateBetween(testUser.getId(), start, end))
                .thenReturn(List.of(revisionSession));

        List<CalendarEventDto.Response> events = calendarService.getEvents(testUser, start, end);

        assertNotNull(events);
        assertEquals(3, events.size());

        // Assert chronological order: plannedTask (today), revision (today+1), deadline (today+2)
        assertEquals(CalendarEventDto.EventType.TASK_SCHEDULED, events.get(0).type());
        assertEquals("Implement Calendar View", events.get(0).title());

        assertEquals(CalendarEventDto.EventType.REVISION_SESSION, events.get(1).type());
        assertTrue(events.get(1).title().contains("Virtual Threads"));

        assertEquals(CalendarEventDto.EventType.TASK_DEADLINE, events.get(2).type());
        assertTrue(events.get(2).isDeadline());
    }

    @Test
    void testRescheduleTask() {
        LocalDate newDate = LocalDate.now().plusDays(3);
        LocalTime newStartTime = LocalTime.of(14, 0);
        CalendarEventDto.RescheduleRequest req = new CalendarEventDto.RescheduleRequest(newDate, newStartTime, null);

        when(taskRepository.findByIdAndUserId(plannedTask.getId(), testUser.getId()))
                .thenReturn(Optional.of(plannedTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        CalendarEventDto.Response response = calendarService.rescheduleTask(testUser, plannedTask.getId(), req);

        assertNotNull(response);
        assertEquals(newDate, response.date());
        assertEquals(newStartTime, response.startTime());
        verify(taskRepository).save(plannedTask);
    }
}
