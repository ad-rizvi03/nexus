package com.personal.productivity.calendar;

import com.personal.productivity.auth.User;
import com.personal.productivity.calendar.dto.CalendarEventDto;
import com.personal.productivity.common.ResourceNotFoundException;
import com.personal.productivity.learning.RevisionSession;
import com.personal.productivity.learning.RevisionSessionRepository;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskRepository;
import com.personal.productivity.tasks.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CalendarService {

    private final TaskRepository taskRepository;
    private final RevisionSessionRepository revisionRepository;

    public CalendarService(TaskRepository taskRepository, RevisionSessionRepository revisionRepository) {
        this.taskRepository = taskRepository;
        this.revisionRepository = revisionRepository;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDto.Response> getEvents(User user, LocalDate startDate, LocalDate endDate) {
        if (startDate == null) startDate = LocalDate.now().minusDays(15);
        if (endDate == null) endDate = LocalDate.now().plusDays(45);

        List<CalendarEventDto.Response> events = new ArrayList<>();

        // 1. Scheduled Tasks
        List<Task> plannedTasks = taskRepository.findByUserIdAndPlannedDateBetween(user.getId(), startDate, endDate);
        for (Task t : plannedTasks) {
            events.add(new CalendarEventDto.Response(
                    t.getId(),
                    t.getTitle(),
                    t.getDescription(),
                    t.getCategory() != null ? t.getCategory().getName() : "General",
                    t.getCategory() != null ? t.getCategory().getColor() : "#C6A56A",
                    t.getPriority(),
                    t.getStatus(),
                    t.getPlannedDate(),
                    t.getStartTime(),
                    t.getEndTime(),
                    t.getEstimatedDurationMinutes() != null ? t.getEstimatedDurationMinutes() : 45,
                    CalendarEventDto.EventType.TASK_SCHEDULED,
                    t.getStatus() == TaskStatus.COMPLETED,
                    false
            ));
        }

        // 2. Task Deadlines
        List<Task> deadlineTasks = taskRepository.findByUserIdAndDeadlineDateBetween(user.getId(), startDate, endDate);
        for (Task t : deadlineTasks) {
            // Avoid duplicate if planned and deadline are the exact same day
            boolean sameDay = t.getPlannedDate() != null && t.getPlannedDate().equals(t.getDeadlineDate());
            if (!sameDay || t.getStatus() != TaskStatus.COMPLETED) {
                events.add(new CalendarEventDto.Response(
                        t.getId(),
                        "DUE: " + t.getTitle(),
                        t.getDescription(),
                        t.getCategory() != null ? t.getCategory().getName() : "General",
                        "#D77E7E", // Red error highlight for deadlines
                        t.getPriority(),
                        t.getStatus(),
                        t.getDeadlineDate(),
                        t.getDeadlineTime(),
                        null,
                        t.getEstimatedDurationMinutes(),
                        CalendarEventDto.EventType.TASK_DEADLINE,
                        t.getStatus() == TaskStatus.COMPLETED,
                        true
                ));
            }
        }

        // 3. Spaced Repetition Revision Sessions
        List<RevisionSession> revisions = revisionRepository.findByUserIdAndScheduledDateBetween(user.getId(), startDate, endDate);
        for (RevisionSession r : revisions) {
            events.add(new CalendarEventDto.Response(
                    r.getId(),
                    "REVISE: " + r.getTopic().getTitle(),
                    r.getNotes(),
                    r.getTopic().getModule().getRoadmap().getSkillName(),
                    "#C6A56A",
                    null,
                    null,
                    r.getScheduledDate(),
                    null,
                    null,
                    r.getTopic().getEstimatedMinutes(),
                    CalendarEventDto.EventType.REVISION_SESSION,
                    Boolean.TRUE.equals(r.getCompleted()),
                    false
            ));
        }

        // Sort events chronologically
        events.sort(Comparator
                .comparing(CalendarEventDto.Response::date)
                .thenComparing(e -> e.startTime() != null ? e.startTime() : java.time.LocalTime.MIN)
                .thenComparing(CalendarEventDto.Response::isDeadline));

        return events;
    }

    @Transactional
    public CalendarEventDto.Response rescheduleTask(User user, UUID taskId, CalendarEventDto.RescheduleRequest request) {
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (request.plannedDate() != null) {
            task.setPlannedDate(request.plannedDate());
        }
        if (request.startTime() != null) {
            task.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            task.setEndTime(request.endTime());
        }

        task = taskRepository.save(task);

        return new CalendarEventDto.Response(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getCategory() != null ? task.getCategory().getName() : "General",
                task.getCategory() != null ? task.getCategory().getColor() : "#C6A56A",
                task.getPriority(),
                task.getStatus(),
                task.getPlannedDate(),
                task.getStartTime(),
                task.getEndTime(),
                task.getEstimatedDurationMinutes(),
                CalendarEventDto.EventType.TASK_SCHEDULED,
                task.getStatus() == TaskStatus.COMPLETED,
                false
        );
    }
}
