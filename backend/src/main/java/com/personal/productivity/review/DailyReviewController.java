package com.personal.productivity.review;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.review.dto.*;
import com.personal.productivity.tasks.dto.TaskResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reviews")
public class DailyReviewController {

    private final DailyReviewService dailyReviewService;
    private final AuthService authService;

    public DailyReviewController(DailyReviewService dailyReviewService, AuthService authService) {
        this.dailyReviewService = dailyReviewService;
        this.authService = authService;
    }

    @GetMapping("/workspace")
    public ResponseEntity<DailyReviewWorkspaceDto> getWorkspace(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentAuthenticatedUser();
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(dailyReviewService.getDailyReviewWorkspace(user.getId(), targetDate));
    }

    @PostMapping("/triage")
    public ResponseEntity<TaskResponse> executeTriage(@RequestBody TaskTriageRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(dailyReviewService.executeTriage(user.getId(), request));
    }

    @PostMapping
    public ResponseEntity<DailyReviewDto> saveReview(@RequestBody DailyReviewSubmissionDto submission) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(dailyReviewService.saveDailyReview(user.getId(), submission));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DailyReviewDto>> getHistory() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(dailyReviewService.getReviewHistory(user.getId()));
    }
}
