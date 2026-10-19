package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.reminders.*;
import com.personal.productivity.reminders.dto.ReminderDto;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskRepository;
import com.personal.productivity.tasks.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReminderServiceTest {

    @Mock
    private ReminderRepository reminderRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ReminderService reminderService;

    private User testUser;
    private UUID userId;
    private Task testTask;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("adnan@example.com");

        testTask = new Task();
        testTask.setId(UUID.randomUUID());
        testTask.setUser(testUser);
        testTask.setTitle("Distributed consensus benchmarking");
        testTask.setStatus(TaskStatus.TO_DO);
    }

    @Test
    void testScheduleReminder_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(taskRepository.findWithDetailsByIdAndUserId(testTask.getId(), userId))
                .thenReturn(Optional.of(testTask));
        when(reminderRepository.existsByUserIdAndTaskIdAndNotificationTypeAndStatus(
                userId, testTask.getId(), NotificationType.TASK_DEADLINE, ReminderStatus.PENDING))
                .thenReturn(false);

        Instant due = Instant.now().plusSeconds(3600);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> {
            Reminder r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        ReminderDto dto = reminderService.scheduleReminder(userId, testTask.getId(), NotificationType.TASK_DEADLINE, due);

        assertNotNull(dto);
        assertEquals(NotificationType.TASK_DEADLINE, dto.notificationType());
        assertEquals(ReminderStatus.PENDING, dto.status());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void testScheduleReminder_DuplicateSuppressed() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(taskRepository.findWithDetailsByIdAndUserId(testTask.getId(), userId))
                .thenReturn(Optional.of(testTask));
        when(reminderRepository.existsByUserIdAndTaskIdAndNotificationTypeAndStatus(
                userId, testTask.getId(), NotificationType.TASK_DEADLINE, ReminderStatus.PENDING))
                .thenReturn(true);

        ReminderDto dto = reminderService.scheduleReminder(userId, testTask.getId(), NotificationType.TASK_DEADLINE, Instant.now());

        assertNull(dto);
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void testProcessDueReminders_SuppressesCompletedTask() {
        testTask.setStatus(TaskStatus.COMPLETED);
        Reminder reminder = new Reminder(testUser, testTask, Instant.now().minusSeconds(60), NotificationType.TASK_DEADLINE);
        reminder.setId(UUID.randomUUID());

        when(reminderRepository.findDueRemindersWithDetails(eq(ReminderStatus.PENDING), any(Instant.class)))
                .thenReturn(List.of(reminder));

        int processed = reminderService.processDueReminders();

        assertEquals(0, processed);
        assertEquals(ReminderStatus.CANCELLED, reminder.getStatus());
        assertTrue(reminder.getLastError().contains("Suppressed: Task status is COMPLETED"));
        verify(emailService, never()).sendEmail(any(), any(), any());
        verify(reminderRepository).save(reminder);
    }

    @Test
    void testProcessDueReminders_DispatchesAndMarksSent() {
        Reminder reminder = new Reminder(testUser, testTask, Instant.now().minusSeconds(60), NotificationType.TASK_DEADLINE);
        reminder.setId(UUID.randomUUID());

        when(reminderRepository.findDueRemindersWithDetails(eq(ReminderStatus.PENDING), any(Instant.class)))
                .thenReturn(List.of(reminder));
        when(emailService.sendEmail(eq("adnan@example.com"), anyString(), anyString()))
                .thenReturn(new EmailService.DeliveryResult(true, "Sent", false));

        int processed = reminderService.processDueReminders();

        assertEquals(1, processed);
        assertEquals(ReminderStatus.SENT, reminder.getStatus());
        assertNotNull(reminder.getSentAt());
        verify(reminderRepository).save(reminder);
    }
}
