package com.personal.productivity.goals;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.goals.dto.GoalDto;
import com.personal.productivity.goals.dto.GoalMilestoneDto;
import com.personal.productivity.tasks.Category;
import com.personal.productivity.tasks.CategoryRepository;
import com.personal.productivity.tasks.TaskRepository;
import com.personal.productivity.tasks.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final GoalMilestoneRepository milestoneRepository;
    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public GoalService(
            GoalRepository goalRepository,
            GoalMilestoneRepository milestoneRepository,
            CategoryRepository categoryRepository,
            TaskRepository taskRepository,
            UserRepository userRepository
    ) {
        this.goalRepository = goalRepository;
        this.milestoneRepository = milestoneRepository;
        this.categoryRepository = categoryRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void seedDefaultsIfEmpty(UUID userId) {
        if (!goalRepository.existsByUserId(userId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            List<Category> categories = categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(userId);
            Category deepWorkCat = categories.stream()
                    .filter(c -> c.getName().equalsIgnoreCase("Deep Work") || c.getName().equalsIgnoreCase("Learning"))
                    .findFirst()
                    .orElse(categories.isEmpty() ? null : categories.get(0));

            Category opsCat = categories.stream()
                    .filter(c -> c.getName().equalsIgnoreCase("Operations") || c.getName().equalsIgnoreCase("Admin"))
                    .findFirst()
                    .orElse(deepWorkCat);

            LocalDate today = LocalDate.now();

            // Goal 1: AWS Certification
            Goal goal1 = new Goal(
                    user,
                    "AWS Solutions Architect & Cloud Systems Mastery",
                    "Acquire professional-level certification with hands-on multi-region infrastructure projects.",
                    deepWorkCat,
                    today.plusDays(45),
                    GoalStatus.IN_PROGRESS
            );
            goal1.getMilestones().add(new GoalMilestone(goal1, "Complete S3, EC2, and VPC Deep-Dive", today.minusDays(10), true, 1));
            goal1.getMilestones().add(new GoalMilestone(goal1, "Master IAM, KMS, and Security Policies", today.minusDays(2), true, 2));
            goal1.getMilestones().add(new GoalMilestone(goal1, "Implement Multi-Region Serverless Project", today.plusDays(20), false, 3));
            goal1.getMilestones().add(new GoalMilestone(goal1, "Pass Official AWS Practice Exam with >85%", today.plusDays(40), false, 4));
            calculateGoalProgress(goal1);
            goalRepository.save(goal1);

            // Goal 2: Distributed Systems Engine
            Goal goal2 = new Goal(
                    user,
                    "Production-Grade Distributed System Implementation",
                    "Design and deploy an asynchronous fault-tolerant event processing pipeline.",
                    deepWorkCat,
                    today.plusDays(30),
                    GoalStatus.IN_PROGRESS
            );
            goal2.getMilestones().add(new GoalMilestone(goal2, "Implement Raft Consensus State Machine & Leader Election", today.minusDays(5), true, 1));
            goal2.getMilestones().add(new GoalMilestone(goal2, "Benchmark Replication & Network Partition Recovery", today.plusDays(15), false, 2));
            goal2.getMilestones().add(new GoalMilestone(goal2, "Publish Open-Source Repository with Architecture RFC", today.plusDays(28), false, 3));
            calculateGoalProgress(goal2);
            goalRepository.save(goal2);

            // Goal 3: Technical Writing
            Goal goal3 = new Goal(
                    user,
                    "High-Impact Engineering Writing Portfolio",
                    "Publish 3 in-depth engineering analyses on database internals and distributed systems.",
                    opsCat,
                    today.plusDays(60),
                    GoalStatus.IN_PROGRESS
            );
            goal3.getMilestones().add(new GoalMilestone(goal3, "Draft Architecture RFC on Microservices to Modular Monolith", today.minusDays(3), true, 1));
            goal3.getMilestones().add(new GoalMilestone(goal3, "Publish Analysis on PostgreSQL WAL & MVCC Internals", today.plusDays(30), false, 2));
            goal3.getMilestones().add(new GoalMilestone(goal3, "Complete Guide on Spring Security 6 Session Management", today.plusDays(55), false, 3));
            calculateGoalProgress(goal3);
            goalRepository.save(goal3);
        }
    }

    @Transactional
    public GoalDto.SummaryResponse getGoalsSummary(UUID userId) {
        seedDefaultsIfEmpty(userId);

        List<Goal> goals = goalRepository.findAllByUserIdWithMilestones(userId);

        List<GoalDto.Response> responses = goals.stream()
                .map(this::toGoalResponse)
                .collect(Collectors.toList());

        int totalGoals = responses.size();
        int inProgressCount = (int) responses.stream().filter(g -> g.status() == GoalStatus.IN_PROGRESS).count();
        int completedCount = (int) responses.stream().filter(g -> g.status() == GoalStatus.COMPLETED).count();

        double avgProgress = responses.isEmpty() ? 0.0 :
                responses.stream().mapToInt(GoalDto.Response::progressPercentage).average().orElse(0.0);

        int onTrack = (int) responses.stream().filter(g -> g.scheduleHealth() == ScheduleHealth.ON_TRACK).count();
        int approaching = (int) responses.stream().filter(g -> g.scheduleHealth() == ScheduleHealth.APPROACHING_DEADLINE).count();
        int overdue = (int) responses.stream().filter(g -> g.scheduleHealth() == ScheduleHealth.OVERDUE).count();

        return new GoalDto.SummaryResponse(
                totalGoals,
                inProgressCount,
                completedCount,
                Math.round(avgProgress * 10.0) / 10.0,
                onTrack,
                approaching,
                overdue,
                responses
        );
    }

    @Transactional
    public GoalDto.Response getGoalById(UUID userId, UUID id) {
        Goal goal = goalRepository.findByIdAndUserIdWithMilestones(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + id));
        return toGoalResponse(goal);
    }

    @Transactional
    public GoalDto.Response createGoal(UUID userId, GoalDto.Request req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Category category = null;
        if (req.categoryId() != null) {
            category = categoryRepository.findByIdAndUserId(req.categoryId(), userId).orElse(null);
        }

        Goal goal = new Goal(
                user,
                req.name(),
                req.description(),
                category,
                req.targetDate(),
                req.status() != null ? req.status() : GoalStatus.IN_PROGRESS
        );
        goal.setReviewNotes(req.reviewNotes());

        if (req.milestones() != null) {
            int sortOrder = 1;
            for (GoalMilestoneDto.Request msReq : req.milestones()) {
                GoalMilestone ms = new GoalMilestone(
                        goal,
                        msReq.title(),
                        msReq.targetDate(),
                        Boolean.TRUE.equals(msReq.completed()),
                        msReq.sortOrder() != null ? msReq.sortOrder() : sortOrder++
                );
                goal.getMilestones().add(ms);
            }
        }

        calculateGoalProgress(goal);
        Goal saved = goalRepository.save(goal);
        return toGoalResponse(saved);
    }

    @Transactional
    public GoalDto.Response updateGoal(UUID userId, UUID id, GoalDto.Request req) {
        Goal goal = goalRepository.findByIdAndUserIdWithMilestones(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + id));

        goal.setName(req.name());
        goal.setDescription(req.description());
        goal.setTargetDate(req.targetDate());
        if (req.status() != null) {
            goal.setStatus(req.status());
        }
        goal.setReviewNotes(req.reviewNotes());

        if (req.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(req.categoryId(), userId).orElse(null);
            goal.setCategory(category);
        } else {
            goal.setCategory(null);
        }

        if (req.milestones() != null) {
            goal.getMilestones().clear();
            int sortOrder = 1;
            for (GoalMilestoneDto.Request msReq : req.milestones()) {
                GoalMilestone ms = new GoalMilestone(
                        goal,
                        msReq.title(),
                        msReq.targetDate(),
                        Boolean.TRUE.equals(msReq.completed()),
                        msReq.sortOrder() != null ? msReq.sortOrder() : sortOrder++
                );
                goal.getMilestones().add(ms);
            }
        }

        calculateGoalProgress(goal);
        Goal saved = goalRepository.save(goal);
        return toGoalResponse(saved);
    }

    @Transactional
    public void deleteGoal(UUID userId, UUID id) {
        Goal goal = goalRepository.findByIdAndUserIdWithMilestones(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + id));

        // Unlink any tasks referencing this goal
        taskRepository.findByGoalId(id).forEach(task -> {
            task.setGoalId(null);
            taskRepository.save(task);
        });

        goalRepository.delete(goal);
    }

    @Transactional
    public GoalDto.Response toggleMilestone(UUID userId, UUID goalId, UUID milestoneId) {
        Goal goal = goalRepository.findByIdAndUserIdWithMilestones(goalId, userId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + goalId));

        GoalMilestone milestone = goal.getMilestones().stream()
                .filter(m -> m.getId().equals(milestoneId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Milestone not found: " + milestoneId));

        milestone.setCompleted(!Boolean.TRUE.equals(milestone.getCompleted()));
        calculateGoalProgress(goal);

        Goal saved = goalRepository.save(goal);
        return toGoalResponse(saved);
    }

    @Transactional
    public GoalDto.Response addMilestone(UUID userId, UUID goalId, GoalMilestoneDto.Request req) {
        Goal goal = goalRepository.findByIdAndUserIdWithMilestones(goalId, userId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + goalId));

        int nextOrder = goal.getMilestones().size() + 1;
        GoalMilestone ms = new GoalMilestone(
                goal,
                req.title(),
                req.targetDate(),
                Boolean.TRUE.equals(req.completed()),
                req.sortOrder() != null ? req.sortOrder() : nextOrder
        );
        goal.getMilestones().add(ms);
        calculateGoalProgress(goal);

        Goal saved = goalRepository.save(goal);
        return toGoalResponse(saved);
    }

    @Transactional
    public GoalDto.Response deleteMilestone(UUID userId, UUID goalId, UUID milestoneId) {
        Goal goal = goalRepository.findByIdAndUserIdWithMilestones(goalId, userId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + goalId));

        goal.getMilestones().removeIf(m -> m.getId().equals(milestoneId));
        calculateGoalProgress(goal);

        Goal saved = goalRepository.save(goal);
        return toGoalResponse(saved);
    }

    private void calculateGoalProgress(Goal goal) {
        List<GoalMilestone> milestones = goal.getMilestones();
        if (milestones.isEmpty()) {
            return;
        }

        long completedCount = milestones.stream().filter(m -> Boolean.TRUE.equals(m.getCompleted())).count();
        int progress = (int) Math.round(((double) completedCount / milestones.size()) * 100.0);
        goal.setProgressPercentage(progress);

        if (progress == 100 && goal.getStatus() != GoalStatus.COMPLETED) {
            goal.setStatus(GoalStatus.COMPLETED);
        } else if (progress < 100 && goal.getStatus() == GoalStatus.COMPLETED) {
            goal.setStatus(GoalStatus.IN_PROGRESS);
        }
    }

    private GoalDto.Response toGoalResponse(Goal goal) {
        List<GoalMilestoneDto.Response> milestoneResponses = goal.getMilestones().stream()
                .map(m -> new GoalMilestoneDto.Response(
                        m.getId(),
                        goal.getId(),
                        m.getTitle(),
                        m.getTargetDate(),
                        Boolean.TRUE.equals(m.getCompleted()),
                        m.getCompletedAt(),
                        m.getSortOrder(),
                        m.getCreatedAt()
                ))
                .collect(Collectors.toList());

        int totalMs = goal.getMilestones().size();
        int completedMs = (int) goal.getMilestones().stream().filter(m -> Boolean.TRUE.equals(m.getCompleted())).count();

        long linkedTasks = taskRepository.countByGoalId(goal.getId());
        long completedTasks = taskRepository.countByGoalIdAndStatus(goal.getId(), TaskStatus.COMPLETED);

        ScheduleHealth health = calculateHealth(goal);

        String catName = goal.getCategory() != null ? goal.getCategory().getName() : null;
        String catColor = goal.getCategory() != null ? goal.getCategory().getColor() : null;
        UUID catId = goal.getCategory() != null ? goal.getCategory().getId() : null;

        return new GoalDto.Response(
                goal.getId(),
                goal.getName(),
                goal.getDescription(),
                catId,
                catName,
                catColor,
                goal.getTargetDate(),
                goal.getStatus(),
                goal.getProgressPercentage(),
                goal.getReviewNotes(),
                health,
                milestoneResponses,
                totalMs,
                completedMs,
                linkedTasks,
                completedTasks,
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }

    private ScheduleHealth calculateHealth(Goal goal) {
        if (goal.getStatus() == GoalStatus.COMPLETED) {
            return ScheduleHealth.COMPLETED;
        }
        LocalDate target = goal.getTargetDate();
        if (target == null) {
            return ScheduleHealth.ON_TRACK;
        }
        LocalDate today = LocalDate.now();
        if (target.isBefore(today)) {
            return ScheduleHealth.OVERDUE;
        }
        if (!target.isAfter(today.plusDays(7))) {
            return ScheduleHealth.APPROACHING_DEADLINE;
        }
        return ScheduleHealth.ON_TRACK;
    }
}
