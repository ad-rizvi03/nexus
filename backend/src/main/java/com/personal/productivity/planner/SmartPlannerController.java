package com.personal.productivity.planner;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.planner.dto.ApplyPlanRequest;
import com.personal.productivity.planner.dto.NaturalLanguageParsedDto;
import com.personal.productivity.planner.dto.SmartPlanResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/planner")
public class SmartPlannerController {

    private final SmartPlannerService plannerService;
    private final NaturalLanguageParser naturalLanguageParser;
    private final AuthService authService;

    public SmartPlannerController(
            SmartPlannerService plannerService,
            NaturalLanguageParser naturalLanguageParser,
            AuthService authService) {
        this.plannerService = plannerService;
        this.naturalLanguageParser = naturalLanguageParser;
        this.authService = authService;
    }

    @GetMapping("/daily")
    public ResponseEntity<SmartPlanResponse> getDailyPlan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentAuthenticatedUser();
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(plannerService.generateDailyPlan(user.getId(), targetDate));
    }

    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyPlan(@RequestBody ApplyPlanRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        int count = plannerService.applyPlan(user.getId(), request);
        return ResponseEntity.ok(Map.of(
                "appliedCount", count,
                "message", "Smart daily plan applied successfully to active schedule."
        ));
    }

    @PostMapping("/parse-entry")
    public ResponseEntity<NaturalLanguageParsedDto> parseEntry(@RequestBody Map<String, String> body) {
        String input = body != null ? body.get("input") : "";
        return ResponseEntity.ok(naturalLanguageParser.parse(input));
    }
}
