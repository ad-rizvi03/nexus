package com.personal.productivity.review;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.focus.FocusSessionRepository;
import com.personal.productivity.goals.GoalMilestone;
import com.personal.productivity.goals.GoalMilestoneRepository;
import com.personal.productivity.habits.HabitEntry;
import com.personal.productivity.habits.HabitEntryRepository;
import com.personal.productivity.learning.LearningTopic;
import com.personal.productivity.learning.LearningTopicRepository;
import com.personal.productivity.review.dto.*;
import com.personal.productivity.tasks.*;
import com.personal.productivity.tasks.dto.TaskResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DailyReviewService {

    private final DailyReviewRepository dailyReviewRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final LearningTopicRepository learningTopicRepository;
    private final GoalMilestoneRepository goalMilestoneRepository;
    private final HabitEntryRepository habitEntryRepository;
    private final UserRepository userRepository;

    public DailyReviewService(
            DailyReviewRepository dailyReviewRepository,
            TaskRepository taskRepository,
            SubtaskRepository subtaskRepository,
            FocusSessionRepository focusSessionRepository,
            LearningTopicRepository learningTopicRepository,
            GoalMilestoneRepository goalMilestoneRepository,
            HabitEntryRepository habitEntryRepository,
            UserRepository userRepository) {
        this.dailyReviewRepository = dailyReviewRepository;
        this.taskRepository = taskRepository;
        this.subtaskRepository = subtaskRepository;
        this.focusSessionRepository = focusSessionRepository;
        this.learningTopicRepository = learningTopicRepository;
        this.goalMilestoneRepository = goalMilestoneRepository;
        this.habitEntryRepository = habitEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DailyReviewWorkspaceDto getDailyReviewWorkspace(UUID userId, LocalDate reviewDate) {
        if (reviewDate == null) {
            reviewDate = LocalDate.now();
        }

        Instant startOfDay = reviewDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = reviewDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);

        List<Task> completedTaskList = taskRepository.findCompletedForDate(userId, reviewDate, startOfDay, endOfDay);
        List<TaskResponse> completedTasks = completedTaskList.stream().map(TaskResponse::fromEntity).toList();

        List<Task> unfinishedTaskList = taskRepository.findUnfinishedForReview(userId, reviewDate);
        List<TaskResponse> unfinishedTasks = unfinishedTaskList.stream().map(TaskResponse::fromEntity).toList();

        List<Task> missedDeadlineList = taskRepository.findMissedDeadlinesForReview(userId, reviewDate);
        List<TaskResponse> missedDeadlines = missedDeadlineList.stream().map(TaskResponse::fromEntity).toList();

        int timeTrackedMinutes = focusSessionRepository.sumDurationMinutes(userId, startOfDay, endOfDay);

        List<LearningTopic> completedTopics = learningTopicRepository.findCompletedByUserIdAndDateRange(userId, startOfDay, endOfDay);
        List<LearningCompletedItemDto> learningItems = completedTopics.stream().map(t -> new LearningCompletedItemDto(
                t.getId(),
                t.getTitle(),
                t.getModule() != null ? t.getModule().getTitle() : null,
                t.getModule() != null && t.getModule().getRoadmap() != null ? t.getModule().getRoadmap().getSkillName() : null,
                t.getCompletedAt()
        )).toList();

        List<GoalMilestone> completedMilestones = goalMilestoneRepository.findCompletedByUserIdAndDateRange(userId, startOfDay, endOfDay);
        List<GoalProgressedItemDto> goalItems = completedMilestones.stream().map(m -> new GoalProgressedItemDto(
                m.getId(),
                m.getTitle(),
                m.getGoal() != null ? m.getGoal().getName() : null,
                m.getCompletedAt()
        )).toList();

        List<HabitEntry> habitEntries = habitEntryRepository.findAllByUserIdAndDateRange(userId, reviewDate, reviewDate);
        int habitsCompletedCount = (int) habitEntries.stream().filter(e -> Boolean.TRUE.equals(e.getCompleted())).count();

        DailyReview review = dailyReviewRepository.findByUserIdAndReviewDate(userId, reviewDate).orElse(null);
        boolean isCompleted = review != null && "COMPLETED".equalsIgnoreCase(review.getStatus());

        return new DailyReviewWorkspaceDto(
                reviewDate,
                isCompleted,
                DailyReviewDto.fromEntity(review),
                completedTasks,
                unfinishedTasks,
                missedDeadlines,
                timeTrackedMinutes,
                learningItems,
                goalItems,
                habitsCompletedCount,
                completedTasks.size(),
                unfinishedTasks.size(),
                missedDeadlines.size()
        );
    }

    public TaskResponse executeTriage(UUID userId, TaskTriageRequest request) {
        Task task = taskRepository.findWithDetailsByIdAndUserId(request.taskId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with ID: " + request.taskId()));

        applyTriageAction(task, request);
        Task saved = taskRepository.save(task);
        return TaskResponse.fromEntity(saved);
    }

    private void applyTriageAction(Task task, TaskTriageRequest request) {
        if (request.action() == null) {
            return;
        }

        switch (request.action()) {
            case RESCHEDULE -> {
                LocalDate targetDate = request.rescheduleDate() != null
                        ? request.rescheduleDate()
                        : (task.getPlannedDate() != null ? task.getPlannedDate().plusDays(1) : LocalDate.now().plusDays(1));
                task.setPlannedDate(targetDate);
                if (request.rescheduleStartTime() != null) {
                    task.setStartTime(request.rescheduleStartTime());
                }
                if (task.getStatus() == TaskStatus.BLOCKED || task.getStatus() == TaskStatus.CANCELLED) {
                    task.setStatus(TaskStatus.TO_DO);
                }
            }
            case BACKLOG -> {
                task.setPlannedDate(null);
                task.setStartTime(null);
                task.setEndTime(null);
            }
            case MARK_BLOCKED -> {
                task.setStatus(TaskStatus.BLOCKED);
                if (request.blockedReason() != null && !request.blockedReason().trim().isEmpty()) {
                    String existing = task.getDescription() != null ? task.getDescription() : "";
                    String reason = "[Blocked]: " + request.blockedReason().trim();
                    task.setDescription(existing.isEmpty() ? reason : existing + "\n" + reason);
                }
            }
            case BREAK_SUBTASKS -> {
                if (request.subtasks() != null && !request.subtasks().isEmpty()) {
                    int sortOrder = task.getSubtasks() != null ? task.getSubtasks().size() : 0;
                    if (task.getSubtasks() == null) {
                        task.setSubtasks(new ArrayList<>());
                    }
                    for (String subtaskTitle : request.subtasks()) {
                        if (subtaskTitle != null && !subtaskTitle.trim().isEmpty()) {
                            Subtask subtask = new Subtask(task, subtaskTitle.trim(), null, sortOrder++);
                            task.getSubtasks().add(subtask);
                            subtaskRepository.save(subtask);
                        }
                    }
                    task.setStatus(TaskStatus.IN_PROGRESS);
                }
            }
            case CANCEL -> task.setStatus(TaskStatus.CANCELLED);
        }
    }

    public DailyReviewDto saveDailyReview(UUID userId, DailyReviewSubmissionDto submission) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        LocalDate reviewDate = submission.reviewDate() != null ? submission.reviewDate() : LocalDate.now();

        // 1. Apply any pending triage actions
        if (submission.triageActions() != null && !submission.triageActions().isEmpty()) {
            for (TaskTriageRequest triageRequest : submission.triageActions()) {
                taskRepository.findWithDetailsByIdAndUserId(triageRequest.taskId(), userId)
                        .ifPresent(task -> {
                            applyTriageAction(task, triageRequest);
                            taskRepository.save(task);
                        });
            }
        }

        // 2. Compute metrics for the review date
        Instant startOfDay = reviewDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = reviewDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);

        int completedTasksCount = taskRepository.findCompletedForDate(userId, reviewDate, startOfDay, endOfDay).size();
        int unfinishedTasksCount = taskRepository.findUnfinishedForReview(userId, reviewDate).size();
        int missedDeadlineCount = taskRepository.findMissedDeadlinesForReview(userId, reviewDate).size();
        int timeTrackedMinutes = focusSessionRepository.sumDurationMinutes(userId, startOfDay, endOfDay);
        int learningCount = learningTopicRepository.findCompletedByUserIdAndDateRange(userId, startOfDay, endOfDay).size();
        int goalsCount = goalMilestoneRepository.findCompletedByUserIdAndDateRange(userId, startOfDay, endOfDay).size();

        List<HabitEntry> habitEntries = habitEntryRepository.findAllByUserIdAndDateRange(userId, reviewDate, reviewDate);
        int habitsCount = (int) habitEntries.stream().filter(e -> Boolean.TRUE.equals(e.getCompleted())).count();

        // 3. Find or create daily review record
        DailyReview review = dailyReviewRepository.findByUserIdAndReviewDate(userId, reviewDate)
                .orElseGet(() -> new DailyReview(user, reviewDate));

        review.setCompletedTaskCount(completedTasksCount);
        review.setUnfinishedTaskCount(unfinishedTasksCount);
        review.setMissedDeadlineCount(missedDeadlineCount);
        review.setTotalTimeTrackedMinutes(timeTrackedMinutes);
        review.setLearningCompletedCount(learningCount);
        review.setGoalsProgressedCount(goalsCount);
        review.setHabitsCompletedCount(habitsCount);
        if (submission.reflectionNotes() != null) {
            review.setReflectionNotes(submission.reflectionNotes());
        }
        review.setStatus("COMPLETED");
        review.setUpdatedAt(Instant.now());

        DailyReview saved = dailyReviewRepository.save(review);
        return DailyReviewDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<DailyReviewDto> getReviewHistory(UUID userId) {
        return dailyReviewRepository.findAllByUserIdOrderByReviewDateDesc(userId)
                .stream()
                .map(DailyReviewDto::fromEntity)
                .toList();
    }
}
