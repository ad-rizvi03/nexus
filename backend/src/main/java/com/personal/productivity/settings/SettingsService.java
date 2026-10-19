package com.personal.productivity.settings;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.settings.dto.UserSettingsDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final AuthService authService;

    public SettingsService(UserSettingsRepository userSettingsRepository, AuthService authService) {
        this.userSettingsRepository = userSettingsRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public UserSettingsDto getSettings() {
        User user = authService.getCurrentAuthenticatedUser();
        UserSettings settings = getOrCreateSettings(user);
        return UserSettingsDto.fromEntity(settings);
    }

    @Transactional
    public UserSettingsDto updateSettings(UserSettingsDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        UserSettings settings = getOrCreateSettings(user);

        settings.setTimeZone(dto.timeZone());
        settings.setFirstDayOfWeek(dto.firstDayOfWeek());
        settings.setWorkStartTime(dto.workStartTime());
        settings.setWorkEndTime(dto.workEndTime());
        settings.setCommuteMinutes(dto.commuteMinutes());
        settings.setWeekdayStudyHours(dto.weekdayStudyHours());
        settings.setWeekendStudyHours(dto.weekendStudyHours());
        settings.setDefaultTaskDurationMinutes(dto.defaultTaskDurationMinutes());
        settings.setDailyAgendaTime(dto.dailyAgendaTime());
        settings.setReviewReminderTime(dto.reviewReminderTime());
        settings.setThemePreference(dto.themePreference());
        settings.setDateFormatPreference(dto.dateFormatPreference());

        settings = userSettingsRepository.save(settings);
        return UserSettingsDto.fromEntity(settings);
    }

    private UserSettings getOrCreateSettings(User user) {
        return userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> userSettingsRepository.save(new UserSettings(user)));
    }
}
