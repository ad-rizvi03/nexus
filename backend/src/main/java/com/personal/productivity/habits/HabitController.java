package com.personal.productivity.habits;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.habits.dto.HabitDto;
import com.personal.productivity.habits.dto.HabitEntryDto;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/habits")
public class HabitController {

    private final HabitService habitService;
    private final AuthService authService;

    public HabitController(HabitService habitService, AuthService authService) {
        this.habitService = habitService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<HabitDto.SummaryResponse> getHabits(
            @RequestParam(required = false, defaultValue = "false") boolean includePaused) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(habitService.getHabitsSummary(user.getId(), includePaused));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HabitDto.Response> getHabitById(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(habitService.getHabitById(user.getId(), id));
    }

    @PostMapping
    public ResponseEntity<HabitDto.Response> createHabit(@Valid @RequestBody HabitDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(habitService.createHabit(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitDto.Response> updateHabit(
            @PathVariable UUID id,
            @Valid @RequestBody HabitDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(habitService.updateHabit(user.getId(), id, request));
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<HabitDto.Response> togglePause(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(habitService.togglePause(user.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        habitService.deleteHabit(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<HabitDto.Response> toggleEntry(
            @PathVariable UUID id,
            @RequestBody(required = false) HabitEntryDto.ToggleRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(habitService.toggleEntry(user.getId(), id, request));
    }

    @GetMapping("/{id}/entries")
    public ResponseEntity<List<HabitEntryDto.Response>> getEntries(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(habitService.getEntries(user.getId(), id, startDate, endDate));
    }
}
