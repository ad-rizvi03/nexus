package com.personal.productivity.tasks;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.tasks.dto.DashboardTodayResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final TaskService taskService;
    private final AuthService authService;

    public DashboardController(TaskService taskService, AuthService authService) {
        this.taskService = taskService;
        this.authService = authService;
    }

    @GetMapping("/today")
    public ResponseEntity<DashboardTodayResponse> getTodayDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(taskService.getDashboardToday(user, date));
    }
}
