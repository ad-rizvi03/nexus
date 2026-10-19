package com.personal.productivity.habits;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.habits.dto.HabitDto;
import com.personal.productivity.habits.dto.HabitEntryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitEntryRepository habitEntryRepository;
    private final UserRepository userRepository;

    public HabitService(
            HabitRepository habitRepository,
            HabitEntryRepository habitEntryRepository,
            UserRepository userRepository
    ) {
        this.habitRepository = habitRepository;
        this.habitEntryRepository = habitEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void seedDefaultsIfEmpty(UUID userId) {
        if (!habitRepository.existsByUserId(userId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            LocalDate today = LocalDate.now();

            // Habit 1: Morning Deep Work
            Habit habit1 = new Habit(
                    user,
                    "Morning Deep Work & System Design",
                    "Dedicated 45-minute distraction-free engineering or architecture session",
                    HabitFrequency.DAILY,
                    45
            );
            Habit saved1 = habitRepository.save(habit1);
            seedEntries(saved1, today, List.of(0, 1, 2, 3, 4, 5)); // 6-day streak

            // Habit 2: Technical Reading
            Habit habit2 = new Habit(
                    user,
                    "Technical Reading & Architecture Notes",
                    "Review 1 research paper, engineering RFC, or documentation chapter",
                    HabitFrequency.WEEKDAYS,
                    30
            );
            Habit saved2 = habitRepository.save(habit2);
            seedEntries(saved2, today, List.of(0, 1, 2, 3)); // 4-day streak

            // Habit 3: Daily Review
            Habit habit3 = new Habit(
                    user,
                    "End of Day Review & Carry-forward",
                    "Audit completed work, backlog unresolved items, plan tomorrow's focus",
                    HabitFrequency.DAILY,
                    15
            );
            Habit saved3 = habitRepository.save(habit3);
            seedEntries(saved3, today, List.of(1, 2, 3, 4)); // 4-day streak ending yesterday
        }
    }

    private void seedEntries(Habit habit, LocalDate today, List<Integer> daysAgoList) {
        for (int daysAgo : daysAgoList) {
            LocalDate d = today.minusDays(daysAgo);
            HabitEntry entry = new HabitEntry(habit, d, true, habit.getTargetDurationMinutes(), "Seeded baseline");
            habitEntryRepository.save(entry);
        }
    }

    @Transactional
    public HabitDto.SummaryResponse getHabitsSummary(UUID userId, boolean includePaused) {
        seedDefaultsIfEmpty(userId);

        List<Habit> habits = includePaused
                ? habitRepository.findAllByUserId(userId)
                : habitRepository.findAllActiveByUserId(userId);

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(29);

        List<HabitDto.Response> responses = habits.stream()
                .map(h -> toHabitResponse(h, today, thirtyDaysAgo))
                .collect(Collectors.toList());

        int totalActive = (int) habits.stream().filter(h -> !Boolean.TRUE.equals(h.getIsPaused())).count();
        int totalPaused = habits.size() - totalActive;

        int completedToday = (int) responses.stream()
                .filter(r -> !r.isPaused() && Boolean.TRUE.equals(r.recentEntries().get(today.toString())))
                .count();

        double avgCompletionRate = responses.isEmpty() ? 0.0 :
                responses.stream().mapToDouble(HabitDto.Response::completionRate30d).average().orElse(0.0);

        int bestStreak = responses.stream().mapToInt(HabitDto.Response::longestStreak).max().orElse(0);

        return new HabitDto.SummaryResponse(
                totalActive,
                totalPaused,
                completedToday,
                Math.round(avgCompletionRate * 10.0) / 10.0,
                bestStreak,
                responses
        );
    }

    @Transactional
    public HabitDto.Response getHabitById(UUID userId, UUID id) {
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Habit not found: " + id));
        LocalDate today = LocalDate.now();
        return toHabitResponse(habit, today, today.minusDays(29));
    }

    @Transactional
    public HabitDto.Response createHabit(UUID userId, HabitDto.Request req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Habit habit = new Habit(
                user,
                req.name(),
                req.description(),
                req.targetFrequency(),
                req.targetDurationMinutes()
        );
        if (req.isPaused() != null) {
            habit.setIsPaused(req.isPaused());
        }

        Habit saved = habitRepository.save(habit);
        LocalDate today = LocalDate.now();
        return toHabitResponse(saved, today, today.minusDays(29));
    }

    @Transactional
    public HabitDto.Response updateHabit(UUID userId, UUID id, HabitDto.Request req) {
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Habit not found: " + id));

        habit.setName(req.name());
        habit.setDescription(req.description());
        if (req.targetFrequency() != null) {
            habit.setTargetFrequency(req.targetFrequency());
        }
        habit.setTargetDurationMinutes(req.targetDurationMinutes());
        if (req.isPaused() != null) {
            habit.setIsPaused(req.isPaused());
        }

        Habit saved = habitRepository.save(habit);
        LocalDate today = LocalDate.now();
        return toHabitResponse(saved, today, today.minusDays(29));
    }

    @Transactional
    public HabitDto.Response togglePause(UUID userId, UUID id) {
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Habit not found: " + id));

        habit.setIsPaused(!Boolean.TRUE.equals(habit.getIsPaused()));
        Habit saved = habitRepository.save(habit);
        LocalDate today = LocalDate.now();
        return toHabitResponse(saved, today, today.minusDays(29));
    }

    @Transactional
    public void deleteHabit(UUID userId, UUID id) {
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Habit not found: " + id));
        habitRepository.delete(habit);
    }

    @Transactional
    public HabitDto.Response toggleEntry(UUID userId, UUID habitId, HabitEntryDto.ToggleRequest req) {
        Habit habit = habitRepository.findByIdAndUserId(habitId, userId)
                .orElseThrow(() -> new NoSuchElementException("Habit not found: " + habitId));

        LocalDate targetDate = req != null && req.entryDate() != null ? req.entryDate() : LocalDate.now();

        Optional<HabitEntry> existingOpt = habitEntryRepository.findByHabitIdAndEntryDate(habitId, targetDate);

        if (existingOpt.isPresent()) {
            HabitEntry entry = existingOpt.get();
            if (req != null && req.completed() != null) {
                entry.setCompleted(req.completed());
            } else {
                entry.setCompleted(!Boolean.TRUE.equals(entry.getCompleted()));
            }
            if (req != null && req.durationMinutes() != null) {
                entry.setDurationMinutes(req.durationMinutes());
            }
            if (req != null && req.notes() != null) {
                entry.setNotes(req.notes());
            }
            habitEntryRepository.save(entry);
        } else {
            boolean completed = req == null || req.completed() == null || req.completed();
            Integer duration = req != null ? req.durationMinutes() : habit.getTargetDurationMinutes();
            String notes = req != null ? req.notes() : null;
            HabitEntry newEntry = new HabitEntry(habit, targetDate, completed, duration, notes);
            habitEntryRepository.save(newEntry);
        }

        LocalDate today = LocalDate.now();
        return toHabitResponse(habit, today, today.minusDays(29));
    }

    @Transactional(readOnly = true)
    public List<HabitEntryDto.Response> getEntries(UUID userId, UUID habitId, LocalDate startDate, LocalDate endDate) {
        Habit habit = habitRepository.findByIdAndUserId(habitId, userId)
                .orElseThrow(() -> new NoSuchElementException("Habit not found: " + habitId));

        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        return habitEntryRepository.findAllByHabitIdAndEntryDateBetweenOrderByEntryDateAsc(habit.getId(), start, end)
                .stream()
                .map(e -> new HabitEntryDto.Response(
                        e.getId(),
                        habit.getId(),
                        e.getEntryDate(),
                        Boolean.TRUE.equals(e.getCompleted()),
                        e.getDurationMinutes(),
                        e.getNotes()
                ))
                .collect(Collectors.toList());
    }

    private HabitDto.Response toHabitResponse(Habit habit, LocalDate today, LocalDate thirtyDaysAgo) {
        List<HabitEntry> allEntries = habitEntryRepository.findAllByHabitIdOrderByEntryDateAsc(habit.getId());

        Set<LocalDate> completedDates = allEntries.stream()
                .filter(e -> Boolean.TRUE.equals(e.getCompleted()))
                .map(HabitEntry::getEntryDate)
                .collect(Collectors.toSet());

        // 1. Calculate Streaks
        int currentStreak = 0;
        LocalDate checkDate = today;
        if (!completedDates.contains(today)) {
            // Check if streak was active yesterday
            checkDate = today.minusDays(1);
        }

        while (completedDates.contains(checkDate)) {
            currentStreak++;
            checkDate = checkDate.minusDays(1);
        }

        int longestStreak = 0;
        int runningStreak = 0;
        List<LocalDate> sortedDates = completedDates.stream().sorted().toList();
        for (int i = 0; i < sortedDates.size(); i++) {
            if (i == 0) {
                runningStreak = 1;
            } else {
                if (sortedDates.get(i).equals(sortedDates.get(i - 1).plusDays(1))) {
                    runningStreak++;
                } else if (!sortedDates.get(i).equals(sortedDates.get(i - 1))) {
                    runningStreak = 1;
                }
            }
            if (runningStreak > longestStreak) {
                longestStreak = runningStreak;
            }
        }
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // 2. 30-Day Completion Rate
        long completedLast30d = completedDates.stream()
                .filter(d -> !d.isBefore(thirtyDaysAgo) && !d.isAfter(today))
                .count();
        double completionRate = Math.round((completedLast30d / 30.0) * 1000.0) / 10.0;

        // 3. Recent 14 days entries map (for interactive matrix)
        Map<String, Boolean> recentEntries = new LinkedHashMap<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            recentEntries.put(d.toString(), completedDates.contains(d));
        }

        LocalDate lastEntryDate = sortedDates.isEmpty() ? null : sortedDates.get(sortedDates.size() - 1);

        return new HabitDto.Response(
                habit.getId(),
                habit.getName(),
                habit.getDescription(),
                habit.getTargetFrequency(),
                habit.getTargetDurationMinutes(),
                Boolean.TRUE.equals(habit.getIsPaused()),
                currentStreak,
                longestStreak,
                completedDates.size(),
                completionRate,
                lastEntryDate,
                recentEntries,
                habit.getCreatedAt(),
                habit.getUpdatedAt()
        );
    }
}
