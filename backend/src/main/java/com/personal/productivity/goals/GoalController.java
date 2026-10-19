package com.personal.productivity.goals;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.goals.dto.GoalDto;
import com.personal.productivity.goals.dto.GoalMilestoneDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalService goalService;
    private final AuthService authService;

    public GoalController(GoalService goalService, AuthService authService) {
        this.goalService = goalService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<GoalDto.SummaryResponse> getGoals() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(goalService.getGoalsSummary(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalDto.Response> getGoalById(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(goalService.getGoalById(user.getId(), id));
    }

    @PostMapping
    public ResponseEntity<GoalDto.Response> createGoal(@Valid @RequestBody GoalDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(goalService.createGoal(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalDto.Response> updateGoal(
            @PathVariable UUID id,
            @Valid @RequestBody GoalDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(goalService.updateGoal(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        goalService.deleteGoal(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{goalId}/milestones/{milestoneId}/toggle")
    public ResponseEntity<GoalDto.Response> toggleMilestone(
            @PathVariable UUID goalId,
            @PathVariable UUID milestoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(goalService.toggleMilestone(user.getId(), goalId, milestoneId));
    }

    @PostMapping("/{goalId}/milestones")
    public ResponseEntity<GoalDto.Response> addMilestone(
            @PathVariable UUID goalId,
            @Valid @RequestBody GoalMilestoneDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(goalService.addMilestone(user.getId(), goalId, request));
    }

    @DeleteMapping("/{goalId}/milestones/{milestoneId}")
    public ResponseEntity<GoalDto.Response> deleteMilestone(
            @PathVariable UUID goalId,
            @PathVariable UUID milestoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(goalService.deleteMilestone(user.getId(), goalId, milestoneId));
    }
}
