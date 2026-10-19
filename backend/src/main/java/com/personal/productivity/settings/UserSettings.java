package com.personal.productivity.settings;

import com.personal.productivity.auth.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "time_zone", nullable = false)
    private String timeZone = "UTC";

    @Column(name = "first_day_of_week", nullable = false)
    private int firstDayOfWeek = 1; // 1 = Monday

    @Column(name = "work_start_time", nullable = false)
    private LocalTime workStartTime = LocalTime.of(9, 0);

    @Column(name = "work_end_time", nullable = false)
    private LocalTime workEndTime = LocalTime.of(18, 0);

    @Column(name = "commute_minutes", nullable = false)
    private int commuteMinutes = 30;

    @Column(name = "weekday_study_hours", nullable = false, precision = 4, scale = 2)
    private BigDecimal weekdayStudyHours = new BigDecimal("2.00");

    @Column(name = "weekend_study_hours", nullable = false, precision = 4, scale = 2)
    private BigDecimal weekendStudyHours = new BigDecimal("4.00");

    @Column(name = "default_task_duration_minutes", nullable = false)
    private int defaultTaskDurationMinutes = 45;

    @Column(name = "daily_agenda_time", nullable = false)
    private LocalTime dailyAgendaTime = LocalTime.of(8, 0);

    @Column(name = "review_reminder_time", nullable = false)
    private LocalTime reviewReminderTime = LocalTime.of(21, 0);

    @Column(name = "theme_preference", nullable = false)
    private String themePreference = "dark";

    @Column(name = "date_format_preference", nullable = false)
    private String dateFormatPreference = "YYYY-MM-DD";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserSettings() {
    }

    public UserSettings(User user) {
        this.user = user;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public int getFirstDayOfWeek() {
        return firstDayOfWeek;
    }

    public void setFirstDayOfWeek(int firstDayOfWeek) {
        this.firstDayOfWeek = firstDayOfWeek;
    }

    public LocalTime getWorkStartTime() {
        return workStartTime;
    }

    public void setWorkStartTime(LocalTime workStartTime) {
        this.workStartTime = workStartTime;
    }

    public LocalTime getWorkEndTime() {
        return workEndTime;
    }

    public void setWorkEndTime(LocalTime workEndTime) {
        this.workEndTime = workEndTime;
    }

    public int getCommuteMinutes() {
        return commuteMinutes;
    }

    public void setCommuteMinutes(int commuteMinutes) {
        this.commuteMinutes = commuteMinutes;
    }

    public BigDecimal getWeekdayStudyHours() {
        return weekdayStudyHours;
    }

    public void setWeekdayStudyHours(BigDecimal weekdayStudyHours) {
        this.weekdayStudyHours = weekdayStudyHours;
    }

    public BigDecimal getWeekendStudyHours() {
        return weekendStudyHours;
    }

    public void setWeekendStudyHours(BigDecimal weekendStudyHours) {
        this.weekendStudyHours = weekendStudyHours;
    }

    public int getDefaultTaskDurationMinutes() {
        return defaultTaskDurationMinutes;
    }

    public void setDefaultTaskDurationMinutes(int defaultTaskDurationMinutes) {
        this.defaultTaskDurationMinutes = defaultTaskDurationMinutes;
    }

    public LocalTime getDailyAgendaTime() {
        return dailyAgendaTime;
    }

    public void setDailyAgendaTime(LocalTime dailyAgendaTime) {
        this.dailyAgendaTime = dailyAgendaTime;
    }

    public LocalTime getReviewReminderTime() {
        return reviewReminderTime;
    }

    public void setReviewReminderTime(LocalTime reviewReminderTime) {
        this.reviewReminderTime = reviewReminderTime;
    }

    public String getThemePreference() {
        return themePreference;
    }

    public void setThemePreference(String themePreference) {
        this.themePreference = themePreference;
    }

    public String getDateFormatPreference() {
        return dateFormatPreference;
    }

    public void setDateFormatPreference(String dateFormatPreference) {
        this.dateFormatPreference = dateFormatPreference;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
