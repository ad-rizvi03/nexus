package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.habits.*;
import com.personal.productivity.habits.dto.HabitDto;
import com.personal.productivity.habits.dto.HabitEntryDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HabitServiceTest {

    @Mock
    private HabitRepository habitRepository;

    @Mock
    private HabitEntryRepository habitEntryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private HabitService habitService;

    private User testUser;
    private Habit testHabit;

    @BeforeEach
    void setUp() {
        testUser = new User("adnan@example.com", "hashed_pwd", "Adnan");
        testUser.setId(UUID.randomUUID());

        testHabit = new Habit(testUser, "Morning Deep Work", "45 min focus block", HabitFrequency.DAILY, 45);
        testHabit.setId(UUID.randomUUID());
    }

    @Test
    void testCreateHabit() {
        HabitDto.Request request = new HabitDto.Request(
                "LeetCode Practice",
                "Solve 2 medium problems",
                HabitFrequency.DAILY,
                40,
                false
        );

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(habitRepository.save(any(Habit.class))).thenAnswer(inv -> {
            Habit h = inv.getArgument(0);
            h.setId(UUID.randomUUID());
            return h;
        });

        HabitDto.Response response = habitService.createHabit(testUser.getId(), request);

        assertNotNull(response);
        assertEquals("LeetCode Practice", response.name());
        assertEquals(HabitFrequency.DAILY, response.targetFrequency());
        assertEquals(40, response.targetDurationMinutes());
        assertFalse(response.isPaused());
        verify(habitRepository).save(any(Habit.class));
    }

    @Test
    void testToggleEntryCreatesWhenAbsent() {
        LocalDate today = LocalDate.now();
        when(habitRepository.findByIdAndUserId(testHabit.getId(), testUser.getId())).thenReturn(Optional.of(testHabit));
        when(habitEntryRepository.findByHabitIdAndEntryDate(testHabit.getId(), today)).thenReturn(Optional.empty());

        HabitEntryDto.ToggleRequest toggleReq = new HabitEntryDto.ToggleRequest(today, true, 45, "Session completed");
        habitService.toggleEntry(testUser.getId(), testHabit.getId(), toggleReq);

        verify(habitEntryRepository).save(any(HabitEntry.class));
    }

    @Test
    void testToggleEntryInvertsWhenPresent() {
        LocalDate today = LocalDate.now();
        HabitEntry existingEntry = new HabitEntry(testHabit, today, true, 45, "Done");
        when(habitRepository.findByIdAndUserId(testHabit.getId(), testUser.getId())).thenReturn(Optional.of(testHabit));
        when(habitEntryRepository.findByHabitIdAndEntryDate(testHabit.getId(), today)).thenReturn(Optional.of(existingEntry));

        // Toggle without explicit completed boolean
        HabitEntryDto.ToggleRequest toggleReq = new HabitEntryDto.ToggleRequest(today, null, null, null);
        habitService.toggleEntry(testUser.getId(), testHabit.getId(), toggleReq);

        assertFalse(existingEntry.getCompleted());
        verify(habitEntryRepository).save(existingEntry);
    }

    @Test
    void testTogglePause() {
        when(habitRepository.findByIdAndUserId(testHabit.getId(), testUser.getId())).thenReturn(Optional.of(testHabit));
        when(habitRepository.save(any(Habit.class))).thenAnswer(inv -> inv.getArgument(0));

        assertFalse(testHabit.getIsPaused());

        HabitDto.Response paused = habitService.togglePause(testUser.getId(), testHabit.getId());
        assertTrue(paused.isPaused());

        HabitDto.Response resumed = habitService.togglePause(testUser.getId(), testHabit.getId());
        assertFalse(resumed.isPaused());
    }

    @Test
    void testStreakCalculation() {
        LocalDate today = LocalDate.now();
        List<HabitEntry> entries = List.of(
                new HabitEntry(testHabit, today, true, 45, null),
                new HabitEntry(testHabit, today.minusDays(1), true, 45, null),
                new HabitEntry(testHabit, today.minusDays(2), true, 45, null)
        );

        when(habitRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(habitRepository.findAllActiveByUserId(testUser.getId())).thenReturn(List.of(testHabit));
        when(habitEntryRepository.findAllByHabitIdOrderByEntryDateAsc(testHabit.getId())).thenReturn(entries);

        HabitDto.SummaryResponse summary = habitService.getHabitsSummary(testUser.getId(), false);

        assertNotNull(summary);
        assertEquals(1, summary.totalActiveHabits());
        assertEquals(1, summary.completedTodayCount());
        assertEquals(3, summary.habits().get(0).currentStreak());
        assertEquals(3, summary.habits().get(0).longestStreak());
    }
}
