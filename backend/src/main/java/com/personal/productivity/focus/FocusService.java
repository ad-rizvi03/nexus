package com.personal.productivity.focus;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.focus.dto.FocusSessionDto;
import com.personal.productivity.learning.LearningTopic;
import com.personal.productivity.learning.LearningTopicRepository;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FocusService {

    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;
    private final LearningTopicRepository learningTopicRepository;
    private final UserRepository userRepository;

    public FocusService(
            FocusSessionRepository focusSessionRepository,
            TaskRepository taskRepository,
            LearningTopicRepository learningTopicRepository,
            UserRepository userRepository
    ) {
        this.focusSessionRepository = focusSessionRepository;
        this.taskRepository = taskRepository;
        this.learningTopicRepository = learningTopicRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void seedDefaultsIfEmpty(UUID userId) {
        if (!focusSessionRepository.existsByUserId(userId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            List<Task> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
            Task task1 = tasks.isEmpty() ? null : tasks.get(0);
            Task task2 = tasks.size() > 1 ? tasks.get(1) : task1;

            Instant now = Instant.now();

            // Session 1: Earlier today, 50m Deep Work
            Instant s1Start = now.minus(3, ChronoUnit.HOURS);
            Instant s1End = s1Start.plus(50, ChronoUnit.MINUTES);
            FocusSession session1 = new FocusSession(
                    user,
                    task1,
                    null,
                    s1Start,
                    s1End,
                    50,
                    SessionType.POMODORO,
                    "High focus on core architecture & refactoring"
            );
            focusSessionRepository.save(session1);

            // Session 2: Earlier today, 25m Pomodoro
            Instant s2Start = now.minus(1, ChronoUnit.HOURS);
            Instant s2End = s2Start.plus(25, ChronoUnit.MINUTES);
            FocusSession session2 = new FocusSession(
                    user,
                    task2,
                    null,
                    s2Start,
                    s2End,
                    25,
                    SessionType.POMODORO,
                    "Sprint execution on test suite"
            );
            focusSessionRepository.save(session2);

            // Session 3: Yesterday, 45m Manual study block
            Instant s3Start = now.minus(1, ChronoUnit.DAYS).minus(4, ChronoUnit.HOURS);
            Instant s3End = s3Start.plus(45, ChronoUnit.MINUTES);
            FocusSession session3 = new FocusSession(
                    user,
                    null,
                    null,
                    s3Start,
                    s3End,
                    45,
                    SessionType.MANUAL,
                    "Distributed systems deep dive"
            );
            focusSessionRepository.save(session3);
        }
    }

    @Transactional
    public FocusSessionDto.SummaryResponse getSummary(UUID userId) {
        seedDefaultsIfEmpty(userId);

        Instant now = Instant.now();
        Instant todayStart = now.truncatedTo(ChronoUnit.DAYS);
        Instant weekStart = now.minus(7, ChronoUnit.DAYS);

        int todayMinutes = focusSessionRepository.sumDurationMinutes(userId, todayStart, now);
        int weekMinutes = focusSessionRepository.sumDurationMinutes(userId, weekStart, now);

        List<FocusSession> allSessions = focusSessionRepository.findAllByUserIdWithDetails(userId);

        int todayCompleted = (int) allSessions.stream()
                .filter(s -> s.getEndTime() != null && !s.getStartTime().isBefore(todayStart))
                .count();

        List<FocusSession> activeList = focusSessionRepository.findAllActiveByUserId(userId);
        FocusSessionDto.Response activeResponse = activeList.isEmpty() ? null : toResponse(activeList.get(0));

        List<FocusSessionDto.Response> recentResponses = allSessions.stream()
                .limit(20)
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new FocusSessionDto.SummaryResponse(
                todayCompleted,
                todayMinutes,
                weekMinutes,
                activeResponse,
                recentResponses
        );
    }

    @Transactional
    public FocusSessionDto.Response startSession(UUID userId, FocusSessionDto.StartRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Auto-close any running sessions
        List<FocusSession> activeSessions = focusSessionRepository.findAllActiveByUserId(userId);
        Instant now = Instant.now();
        for (FocusSession active : activeSessions) {
            active.setEndTime(now);
            long mins = Math.max(1, Duration.between(active.getStartTime(), now).toMinutes());
            active.setDurationMinutes((int) mins);
            focusSessionRepository.save(active);
        }

        Task task = null;
        if (req != null && req.taskId() != null) {
            task = taskRepository.findByIdAndUserId(req.taskId(), userId).orElse(null);
        }

        LearningTopic topic = null;
        if (req != null && req.learningTopicId() != null) {
            topic = learningTopicRepository.findById(req.learningTopicId()).orElse(null);
        }

        SessionType type = req != null && req.sessionType() != null ? req.sessionType() : SessionType.POMODORO;
        String notes = req != null ? req.notes() : null;

        FocusSession session = new FocusSession(user, task, topic, now, null, null, type, notes);
        FocusSession saved = focusSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional
    public FocusSessionDto.Response stopSession(UUID userId, UUID sessionId, FocusSessionDto.StopRequest req) {
        FocusSession session = focusSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new NoSuchElementException("Focus session not found: " + sessionId));

        Instant now = Instant.now();
        session.setEndTime(now);

        if (req != null && req.durationMinutes() != null && req.durationMinutes() > 0) {
            session.setDurationMinutes(req.durationMinutes());
        } else {
            long mins = Math.max(1, Duration.between(session.getStartTime(), now).toMinutes());
            session.setDurationMinutes((int) mins);
        }

        if (req != null && req.notes() != null && !req.notes().trim().isEmpty()) {
            session.setNotes(req.notes().trim());
        }

        FocusSession saved = focusSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional
    public FocusSessionDto.Response createManualEntry(UUID userId, FocusSessionDto.ManualRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Task task = null;
        if (req.taskId() != null) {
            task = taskRepository.findByIdAndUserId(req.taskId(), userId).orElse(null);
        }

        LearningTopic topic = null;
        if (req.learningTopicId() != null) {
            topic = learningTopicRepository.findById(req.learningTopicId()).orElse(null);
        }

        int duration = req.durationMinutes() != null ? req.durationMinutes() : 25;
        Instant start = req.startTime() != null ? req.startTime() : Instant.now().minus(Duration.ofMinutes(duration));
        Instant end = start.plus(Duration.ofMinutes(duration));

        SessionType type = req.sessionType() != null ? req.sessionType() : SessionType.MANUAL;

        FocusSession session = new FocusSession(user, task, topic, start, end, duration, type, req.notes());
        FocusSession saved = focusSessionRepository.save(session);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public FocusSessionDto.Response getActiveSession(UUID userId) {
        List<FocusSession> activeList = focusSessionRepository.findAllActiveByUserId(userId);
        if (activeList.isEmpty()) {
            return null;
        }
        return toResponse(activeList.get(0));
    }

    @Transactional
    public void deleteSession(UUID userId, UUID id) {
        FocusSession session = focusSessionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Focus session not found: " + id));
        focusSessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public List<FocusSessionDto.Response> getSessions(UUID userId, Instant start, Instant end) {
        Instant startTime = start != null ? start : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant endTime = end != null ? end : Instant.now();

        return focusSessionRepository.findAllByUserIdAndDateRange(userId, startTime, endTime)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private FocusSessionDto.Response toResponse(FocusSession session) {
        UUID taskId = session.getTask() != null ? session.getTask().getId() : null;
        String taskTitle = session.getTask() != null ? session.getTask().getTitle() : null;

        UUID topicId = session.getLearningTopic() != null ? session.getLearningTopic().getId() : null;
        String topicTitle = session.getLearningTopic() != null ? session.getLearningTopic().getTitle() : null;

        return new FocusSessionDto.Response(
                session.getId(),
                taskId,
                taskTitle,
                topicId,
                topicTitle,
                session.getStartTime(),
                session.getEndTime(),
                session.getDurationMinutes(),
                session.getSessionType(),
                session.getNotes(),
                session.getEndTime() == null,
                session.getCreatedAt()
        );
    }
}
