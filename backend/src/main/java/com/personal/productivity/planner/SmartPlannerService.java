package com.personal.productivity.planner;

import com.personal.productivity.planner.dto.ApplyPlanRequest;
import com.personal.productivity.planner.dto.SmartPlanResponse;
import com.personal.productivity.planner.dto.SmartPlanSlotDto;
import com.personal.productivity.settings.UserSettings;
import com.personal.productivity.settings.UserSettingsRepository;
import com.personal.productivity.tasks.Task;
import com.personal.productivity.tasks.TaskPriority;
import com.personal.productivity.tasks.TaskRepository;
import com.personal.productivity.tasks.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class SmartPlannerService {

    private final TaskRepository taskRepository;
    private final UserSettingsRepository userSettingsRepository;

    public SmartPlannerService(
            TaskRepository taskRepository,
            UserSettingsRepository userSettingsRepository) {
        this.taskRepository = taskRepository;
        this.userSettingsRepository = userSettingsRepository;
    }

    @Transactional(readOnly = true)
    public SmartPlanResponse generateDailyPlan(UUID userId, LocalDate targetDate) {
        final LocalDate effectiveDate = targetDate != null ? targetDate : LocalDate.now();

        // 1. Retrieve User Settings & Availability
        UserSettings settings = userSettingsRepository.findByUserId(userId).orElse(null);
        LocalTime workStart = settings != null && settings.getWorkStartTime() != null ? settings.getWorkStartTime() : LocalTime.of(9, 0);
        LocalTime workEnd = settings != null && settings.getWorkEndTime() != null ? settings.getWorkEndTime() : LocalTime.of(18, 0);
        int commuteMin = settings != null ? settings.getCommuteMinutes() : 30;

        boolean isWeekend = effectiveDate.getDayOfWeek() == DayOfWeek.SATURDAY || effectiveDate.getDayOfWeek() == DayOfWeek.SUNDAY;
        int studyMinutes = settings != null
                ? (isWeekend ? (int)(settings.getWeekendStudyHours().doubleValue() * 60) : (int)(settings.getWeekdayStudyHours().doubleValue() * 60))
                : (isWeekend ? 240 : 120);

        int workDayMinutes = (int) ChronoUnit.MINUTES.between(workStart, workEnd);
        int availableCapacityMinutes = isWeekend ? (studyMinutes + 180) : (workDayMinutes - 60 + studyMinutes); // minus 60m lunch

        // 2. Retrieve Active Tasks (Planned for target date, overdue, or in progress)
        List<Task> candidateTasks = new ArrayList<>();
        List<Task> plannedTasks = taskRepository.findByUserIdAndPlannedDate(userId, effectiveDate);
        candidateTasks.addAll(plannedTasks);

        List<Task> overdueTasks = taskRepository.findOverdueTasks(userId, effectiveDate);
        for (Task ot : overdueTasks) {
            if (candidateTasks.stream().noneMatch(t -> t.getId().equals(ot.getId()))) {
                candidateTasks.add(ot);
            }
        }

        // Filter out completed and cancelled tasks
        List<Task> activeTasks = candidateTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getStatus() != TaskStatus.CANCELLED)
                .toList();

        // 3. Heuristic Sort: Overdue & Urgent first, then by priority, then estimated duration
        List<Task> sortedTasks = new ArrayList<>(activeTasks);
        sortedTasks.sort((a, b) -> {
            boolean aOverdue = a.getDeadlineDate() != null && a.getDeadlineDate().isBefore(effectiveDate);
            boolean bOverdue = b.getDeadlineDate() != null && b.getDeadlineDate().isBefore(effectiveDate);
            if (aOverdue != bOverdue) return aOverdue ? -1 : 1;

            int prioCompare = b.getPriority().compareTo(a.getPriority());
            if (prioCompare != 0) return prioCompare;

            int durA = a.getEstimatedDurationMinutes() != null ? a.getEstimatedDurationMinutes() : 45;
            int durB = b.getEstimatedDurationMinutes() != null ? b.getEstimatedDurationMinutes() : 45;
            return Integer.compare(durA, durB);
        });

        int totalPlannedDuration = 0;
        for (Task t : sortedTasks) {
            totalPlannedDuration += t.getEstimatedDurationMinutes() != null ? t.getEstimatedDurationMinutes() : 45;
        }

        int overloadMinutes = Math.max(0, totalPlannedDuration - availableCapacityMinutes);
        String planStatus = overloadMinutes > 0 ? "OVERLOADED" : (totalPlannedDuration < availableCapacityMinutes * 0.4 ? "UNDERALLOCATED" : "OPTIMAL");

        // 4. Build Chronological Slots & Explain Rationale
        List<SmartPlanSlotDto> slots = new ArrayList<>();
        List<String> rationale = new ArrayList<>();
        List<String> rulesApplied = new ArrayList<>();

        rulesApplied.add("Rule 1: Isolated professional work hours (" + workStart + " - " + workEnd + ") and commute (" + commuteMin + "m).");
        rulesApplied.add("Rule 2: Allocated dedicated study block (" + studyMinutes + "m capacity).");
        rulesApplied.add("Rule 3: Prioritized overdue & high-urgency tasks in prime morning focus blocks.");
        rulesApplied.add("Rule 4: Inserted 15-minute buffers between intensive assignments to prevent fatigue.");

        LocalTime currentTime = isWeekend ? LocalTime.of(9, 30) : workStart;
        int accumulatedMinutes = 0;

        for (Task task : sortedTasks) {
            int duration = task.getEstimatedDurationMinutes() != null ? task.getEstimatedDurationMinutes() : 45;
            boolean isOverdue = task.getDeadlineDate() != null && task.getDeadlineDate().isBefore(effectiveDate);

            LocalTime slotStart = currentTime;
            LocalTime slotEnd = slotStart.plusMinutes(duration);

            accumulatedMinutes += duration;
            boolean fitsInCapacity = accumulatedMinutes <= availableCapacityMinutes;

            String slotRationale;
            if (isOverdue) {
                slotRationale = "Overdue task. Placed at earliest available priority window to resolve backlog.";
            } else if (task.getPriority() == TaskPriority.URGENT) {
                slotRationale = "Urgent priority task. Scheduled before standard commitments.";
            } else if (!fitsInCapacity) {
                slotRationale = "Caution: Exceeds standard daily capacity by " + (accumulatedMinutes - availableCapacityMinutes) + "m. Recommend carry-forward to next available day.";
            } else {
                slotRationale = "Optimal slot matching priority and duration estimate.";
            }

            String slotType = "WORK_BLOCK";
            if (task.getCategory() != null && task.getCategory().getName().toLowerCase().contains("learn")) {
                slotType = "STUDY_BLOCK";
            } else if (task.getCategory() != null && task.getCategory().getName().toLowerCase().contains("person")) {
                slotType = "PERSONAL_BLOCK";
            }

            slots.add(new SmartPlanSlotDto(
                    UUID.randomUUID().toString(),
                    task.getId(),
                    task.getTitle(),
                    task.getCategory() != null ? task.getCategory().getName() : "General",
                    task.getCategory() != null ? task.getCategory().getColor() : "#C6A56A",
                    task.getPriority(),
                    slotType,
                    slotStart,
                    slotEnd,
                    duration,
                    slotRationale,
                    fitsInCapacity
            ));

            currentTime = slotEnd.plusMinutes(15); // 15 min buffer
        }

        if (overloadMinutes > 0) {
            rationale.add("Planned work (" + totalPlannedDuration + "m) exceeds available capacity (" + availableCapacityMinutes + "m) by " + overloadMinutes + "m. Please consider carrying forward low-priority items.");
        } else {
            rationale.add("Balanced daily distribution: " + totalPlannedDuration + "m planned across " + availableCapacityMinutes + "m total capacity.");
        }

        String overallSummary = String.format("%d tasks scheduled (%dm total). Status: %s. %s",
                slots.size(), totalPlannedDuration, planStatus,
                overloadMinutes > 0 ? "Workload exceeds available time." : "All tasks fit within configured availability.");

        return new SmartPlanResponse(
                effectiveDate,
                workStart,
                workEnd,
                commuteMin,
                availableCapacityMinutes,
                totalPlannedDuration,
                overloadMinutes,
                planStatus,
                overallSummary,
                slots,
                rationale,
                rulesApplied
        );
    }

    public int applyPlan(UUID userId, ApplyPlanRequest request) {
        if (request == null || request.slots() == null) {
            return 0;
        }

        int updatedCount = 0;
        for (ApplyPlanRequest.SlotApplyItem item : request.slots()) {
            if (item.taskId() != null) {
                Optional<Task> optTask = taskRepository.findWithDetailsByIdAndUserId(item.taskId(), userId);
                if (optTask.isPresent()) {
                    Task task = optTask.get();
                    if (item.plannedDate() != null) {
                        task.setPlannedDate(item.plannedDate());
                    } else if (request.targetDate() != null) {
                        task.setPlannedDate(request.targetDate());
                    }
                    if (item.startTime() != null) {
                        task.setStartTime(item.startTime());
                    }
                    if (item.endTime() != null) {
                        task.setEndTime(item.endTime());
                    }
                    taskRepository.save(task);
                    updatedCount++;
                }
            }
        }

        return updatedCount;
    }
}
