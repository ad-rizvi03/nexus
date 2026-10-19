package com.personal.productivity.reminders;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.reminders.dto.ReminderDto;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskRepository;
import com.personal.productivity.tasks.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private final ReminderRepository reminderRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ReminderService(
            ReminderRepository reminderRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.reminderRepository = reminderRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public ReminderDto scheduleReminder(UUID userId, UUID taskId, NotificationType type, Instant scheduledAt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Task task = null;
        if (taskId != null) {
            task = taskRepository.findWithDetailsByIdAndUserId(taskId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Task not found with ID: " + taskId));

            // Prevent duplicate pending reminders for the exact same task and type
            if (reminderRepository.existsByUserIdAndTaskIdAndNotificationTypeAndStatus(
                    userId, taskId, type, ReminderStatus.PENDING)) {
                log.debug("Pending reminder already exists for user {} and task {}", userId, taskId);
                return null;
            }
        }

        if (scheduledAt == null) {
            scheduledAt = Instant.now();
        }

        Reminder reminder = new Reminder(user, task, scheduledAt, type != null ? type : NotificationType.TASK_DEADLINE);
        Reminder saved = reminderRepository.save(reminder);
        return ReminderDto.fromEntity(saved);
    }

    public int processDueReminders() {
        List<Reminder> dueReminders = reminderRepository.findDueRemindersWithDetails(
                ReminderStatus.PENDING, Instant.now());

        int processed = 0;
        for (Reminder reminder : dueReminders) {
            Task task = reminder.getTask();

            // Suppress if task is completed or cancelled
            if (task != null && (task.getStatus() == TaskStatus.COMPLETED || task.getStatus() == TaskStatus.CANCELLED)) {
                reminder.setStatus(ReminderStatus.CANCELLED);
                reminder.setLastError("Suppressed: Task status is " + task.getStatus());
                reminderRepository.save(reminder);
                continue;
            }

            User user = reminder.getUser();
            String recipient = user != null ? user.getEmail() : null;
            if (recipient == null || recipient.isBlank()) {
                reminder.setStatus(ReminderStatus.FAILED);
                reminder.setLastError("User email is empty");
                reminderRepository.save(reminder);
                continue;
            }

            String subject = buildSubject(reminder);
            String body = buildBody(reminder);

            EmailService.DeliveryResult result = emailService.sendEmail(recipient, subject, body);
            if (result.success()) {
                reminder.setStatus(ReminderStatus.SENT);
                reminder.setSentAt(Instant.now());
                processed++;
            } else {
                reminder.setAttemptCount(reminder.getAttemptCount() + 1);
                reminder.setLastError(result.message());
                if (reminder.getAttemptCount() >= 3) {
                    reminder.setStatus(ReminderStatus.FAILED);
                }
            }
            reminderRepository.save(reminder);
        }

        return processed;
    }

    private String buildSubject(Reminder reminder) {
        String taskTitle = reminder.getTask() != null ? reminder.getTask().getTitle() : "Notification";
        return switch (reminder.getNotificationType()) {
            case TASK_DEADLINE -> "[Arclight Alert] Deadline Reminder: " + taskTitle;
            case OVERDUE -> "[Arclight Alert] Overdue Task Attention Required: " + taskTitle;
            case TASK_SCHEDULED -> "[Arclight Schedule] Task Scheduled for Today: " + taskTitle;
            case MORNING_AGENDA -> "[Arclight Briefing] Today's Daily Agenda";
            case DAILY_REVIEW -> "[Arclight Retrospective] End-of-Day Review Reminder";
            case GOAL_DEADLINE -> "[Arclight Strategic] Goal Milestone Target Reminder";
        };
    }

    private String buildBody(Reminder reminder) {
        Task task = reminder.getTask();
        return """
                ARCLIGHT NOTIFICATION DISPATCH
                ------------------------------
                Notification Type: %s
                Scheduled Time: %s
                Task: %s
                Priority: %s
                Planned Date: %s
                Deadline: %s

                Please log in to your console at http://localhost:4201 to take action.
                """.formatted(
                reminder.getNotificationType(),
                reminder.getScheduledAt(),
                task != null ? task.getTitle() : "N/A",
                task != null ? task.getPriority() : "N/A",
                task != null ? task.getPlannedDate() : "N/A",
                task != null ? task.getDeadlineDate() : "N/A"
        );
    }

    public void cancelReminder(UUID userId, UUID reminderId) {
        Reminder reminder = reminderRepository.findByIdAndUserId(reminderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found: " + reminderId));
        reminder.setStatus(ReminderStatus.CANCELLED);
        reminderRepository.save(reminder);
    }

    @Transactional(readOnly = true)
    public List<ReminderDto> getRemindersForUser(UUID userId) {
        return reminderRepository.findAllByUserIdWithDetails(userId)
                .stream()
                .map(ReminderDto::fromEntity)
                .toList();
    }
}
