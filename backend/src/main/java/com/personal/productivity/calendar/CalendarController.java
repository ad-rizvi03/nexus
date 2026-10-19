package com.personal.productivity.calendar;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.calendar.dto.CalendarEventDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/calendar")
public class CalendarController {

    private final CalendarService calendarService;
    private final AuthService authService;

    public CalendarController(CalendarService calendarService, AuthService authService) {
        this.calendarService = calendarService;
        this.authService = authService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventDto.Response>> getEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(calendarService.getEvents(user, startDate, endDate));
    }

    @PatchMapping("/tasks/{taskId}/reschedule")
    public ResponseEntity<CalendarEventDto.Response> rescheduleTask(
            @PathVariable UUID taskId,
            @RequestBody CalendarEventDto.RescheduleRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(calendarService.rescheduleTask(user, taskId, request));
    }
}
