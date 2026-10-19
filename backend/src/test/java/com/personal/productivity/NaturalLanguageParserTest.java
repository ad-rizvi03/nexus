package com.personal.productivity;

import com.personal.productivity.planner.NaturalLanguageParser;
import com.personal.productivity.planner.dto.NaturalLanguageParsedDto;
import com.personal.productivity.tasks.TaskPriority;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class NaturalLanguageParserTest {

    private NaturalLanguageParser parser;

    @BeforeEach
    void setUp() {
        parser = new NaturalLanguageParser();
    }

    @Test
    void testParse_TomorrowWithDurationAndUrgent() {
        String input = "Study Spring Boot tomorrow for 45 minutes urgent";
        NaturalLanguageParsedDto result = parser.parse(input);

        assertNotNull(result);
        assertEquals(LocalDate.now().plusDays(1), result.plannedDate());
        assertEquals(45, result.estimatedDurationMinutes());
        assertEquals(TaskPriority.URGENT, result.priority());
        assertTrue(result.title().contains("Study Spring Boot"));
    }

    @Test
    void testParse_TimeAndHours() {
        String input = "Review Raft paper at 14:00 for 1.5 hours high priority";
        NaturalLanguageParsedDto result = parser.parse(input);

        assertNotNull(result);
        assertEquals(90, result.estimatedDurationMinutes());
        assertEquals(LocalTime.of(14, 0), result.startTime());
        assertEquals(TaskPriority.HIGH, result.priority());
        assertTrue(result.title().contains("Review Raft paper"));
    }
}
