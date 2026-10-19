package com.personal.productivity.reminders;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.reminders.dto.ReminderDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reminders")
public class ReminderController {

    private final ReminderService reminderService;
    private final EmailService emailService;
    private final AuthService authService;

    public ReminderController(
            ReminderService reminderService,
            EmailService emailService,
            AuthService authService) {
        this.reminderService = reminderService;
        this.emailService = emailService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<ReminderDto>> getReminders() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(reminderService.getRemindersForUser(user.getId()));
    }

    @PostMapping("/test-email")
    public ResponseEntity<EmailService.DeliveryResult> sendTestEmail(
            @RequestBody(required = false) Map<String, String> request) {
        User user = authService.getCurrentAuthenticatedUser();
        String toEmail = (request != null && request.containsKey("toEmail") && !request.get("toEmail").isBlank())
                ? request.get("toEmail").trim()
                : user.getEmail();

        return ResponseEntity.ok(emailService.sendTestEmail(toEmail));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelReminder(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        reminderService.cancelReminder(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processReminders() {
        int count = reminderService.processDueReminders();
        return ResponseEntity.ok(Map.of(
                "processedCount", count,
                "message", "Queue dispatched successfully."
        ));
    }
}
