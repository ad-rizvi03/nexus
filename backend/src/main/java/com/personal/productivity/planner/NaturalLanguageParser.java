package com.personal.productivity.planner;

import com.personal.productivity.planner.dto.NaturalLanguageParsedDto;
import com.personal.productivity.tasks.TaskPriority;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class NaturalLanguageParser {

    private static final Pattern DURATION_PATTERN = Pattern.compile(
            "\\b(?:for\\s+)?(\\d+(?:\\.\\d+)?)\\s*(minutes?|mins?|m|hours?|hrs?|h)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern TIME_PATTERN = Pattern.compile(
            "\\bat\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\b|\\b(\\d{1,2}):(\\d{2})\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PRIORITY_PATTERN = Pattern.compile(
            "\\b(urgent|critical|high priority|high|low priority|low)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "\\b(today|tomorrow|in\\s+(\\d+)\\s+days?|next\\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(monday|tuesday|wednesday|thursday|friday|saturday|sunday))\\b",
            Pattern.CASE_INSENSITIVE
    );

    public NaturalLanguageParsedDto parse(String input) {
        if (input == null || input.isBlank()) {
            return new NaturalLanguageParsedDto(
                    "", "Untitled Task", LocalDate.now(), null, 45, TaskPriority.MEDIUM, "LOW", "Empty input; defaults applied."
            );
        }

        String cleaned = input.trim();
        String workingText = cleaned;

        // 1. Duration
        Integer duration = null;
        Matcher durMatcher = DURATION_PATTERN.matcher(workingText);
        if (durMatcher.find()) {
            double val = Double.parseDouble(durMatcher.group(1));
            String unit = durMatcher.group(2).toLowerCase(Locale.ROOT);
            if (unit.startsWith("h")) {
                duration = (int) Math.round(val * 60);
            } else {
                duration = (int) Math.round(val);
            }
            workingText = workingText.substring(0, durMatcher.start()) + " " + workingText.substring(durMatcher.end());
        }

        // 2. Priority
        TaskPriority priority = TaskPriority.MEDIUM;
        Matcher prioMatcher = PRIORITY_PATTERN.matcher(workingText);
        if (prioMatcher.find()) {
            String pStr = prioMatcher.group(1).toLowerCase(Locale.ROOT);
            if (pStr.contains("urgent") || pStr.contains("critical")) {
                priority = TaskPriority.URGENT;
            } else if (pStr.contains("high")) {
                priority = TaskPriority.HIGH;
            } else if (pStr.contains("low")) {
                priority = TaskPriority.LOW;
            }
            workingText = workingText.substring(0, prioMatcher.start()) + " " + workingText.substring(prioMatcher.end());
        }

        // 3. Planned Date
        LocalDate plannedDate = null;
        Matcher dateMatcher = DATE_PATTERN.matcher(workingText);
        if (dateMatcher.find()) {
            String match = dateMatcher.group(1).toLowerCase(Locale.ROOT);
            if (match.equals("today")) {
                plannedDate = LocalDate.now();
            } else if (match.equals("tomorrow")) {
                plannedDate = LocalDate.now().plusDays(1);
            } else if (match.startsWith("in ") && dateMatcher.group(2) != null) {
                int days = Integer.parseInt(dateMatcher.group(2));
                plannedDate = LocalDate.now().plusDays(days);
            } else {
                String dayName = dateMatcher.group(3) != null ? dateMatcher.group(3) : dateMatcher.group(4);
                if (dayName != null) {
                    DayOfWeek targetDow = parseDayOfWeek(dayName);
                    plannedDate = LocalDate.now().with(TemporalAdjusters.next(targetDow));
                }
            }
            workingText = workingText.substring(0, dateMatcher.start()) + " " + workingText.substring(dateMatcher.end());
        }

        // 4. Start Time
        LocalTime startTime = null;
        Matcher timeMatcher = TIME_PATTERN.matcher(workingText);
        if (timeMatcher.find()) {
            if (timeMatcher.group(1) != null) {
                int hour = Integer.parseInt(timeMatcher.group(1));
                int min = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
                String ampm = timeMatcher.group(3);
                if (ampm != null) {
                    if (ampm.equalsIgnoreCase("pm") && hour < 12) hour += 12;
                    if (ampm.equalsIgnoreCase("am") && hour == 12) hour = 0;
                }
                startTime = LocalTime.of(hour, min);
            } else if (timeMatcher.group(4) != null) {
                int hour = Integer.parseInt(timeMatcher.group(4));
                int min = Integer.parseInt(timeMatcher.group(5));
                startTime = LocalTime.of(hour, min);
            }
            workingText = workingText.substring(0, timeMatcher.start()) + " " + workingText.substring(timeMatcher.end());
        }

        // 5. Clean Title
        String title = workingText.replaceAll("\\s+", " ")
                .replaceAll("(?i)\\b(on|for|at)\\b$", "")
                .trim();
        if (title.isEmpty()) {
            title = cleaned;
        }

        if (plannedDate == null) {
            plannedDate = LocalDate.now();
        }
        if (duration == null) {
            duration = 45;
        }

        String confidence = (durMatcher.reset().find() && dateMatcher.reset().find()) ? "HIGH" : "MEDIUM";
        String explanation = String.format("Interpreted title: '%s', planned for %s%s, estimated %dm, priority %s.",
                title,
                plannedDate,
                startTime != null ? " at " + startTime : "",
                duration,
                priority);

        return new NaturalLanguageParsedDto(
                cleaned, title, plannedDate, startTime, duration, priority, confidence, explanation
        );
    }

    private DayOfWeek parseDayOfWeek(String str) {
        return switch (str.toLowerCase(Locale.ROOT)) {
            case "monday" -> DayOfWeek.MONDAY;
            case "tuesday" -> DayOfWeek.TUESDAY;
            case "wednesday" -> DayOfWeek.WEDNESDAY;
            case "thursday" -> DayOfWeek.THURSDAY;
            case "friday" -> DayOfWeek.FRIDAY;
            case "saturday" -> DayOfWeek.SATURDAY;
            default -> DayOfWeek.SUNDAY;
        };
    }
}
