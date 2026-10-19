package com.personal.productivity.focus;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.focus.dto.FocusSessionDto;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/focus")
public class FocusController {

    private final FocusService focusService;
    private final AuthService authService;

    public FocusController(FocusService focusService, AuthService authService) {
        this.focusService = focusService;
        this.authService = authService;
    }

    @GetMapping("/summary")
    public ResponseEntity<FocusSessionDto.SummaryResponse> getSummary() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(focusService.getSummary(user.getId()));
    }

    @GetMapping("/active")
    public ResponseEntity<FocusSessionDto.Response> getActiveSession() {
        User user = authService.getCurrentAuthenticatedUser();
        FocusSessionDto.Response active = focusService.getActiveSession(user.getId());
        if (active == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(active);
    }

    @PostMapping("/start")
    public ResponseEntity<FocusSessionDto.Response> startSession(
            @RequestBody(required = false) FocusSessionDto.StartRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(focusService.startSession(user.getId(), request));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<FocusSessionDto.Response> stopSession(
            @PathVariable UUID id,
            @RequestBody(required = false) FocusSessionDto.StopRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(focusService.stopSession(user.getId(), id, request));
    }

    @PostMapping("/manual")
    public ResponseEntity<FocusSessionDto.Response> createManualEntry(
            @Valid @RequestBody FocusSessionDto.ManualRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(focusService.createManualEntry(user.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        focusService.deleteSession(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<FocusSessionDto.Response>> getSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(focusService.getSessions(user.getId(), startDate, endDate));
    }
}
