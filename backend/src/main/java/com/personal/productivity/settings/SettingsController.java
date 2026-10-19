package com.personal.productivity.settings;

import com.personal.productivity.settings.dto.UserSettingsDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<UserSettingsDto> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<UserSettingsDto> updateSettings(@Valid @RequestBody UserSettingsDto dto) {
        return ResponseEntity.ok(settingsService.updateSettings(dto));
    }
}
