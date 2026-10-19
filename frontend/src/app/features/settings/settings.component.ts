import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-viewport">
      <div class="toolbar">
        <div>
          <span class="eyebrow">APPLICATION & SYSTEM CONFIGURATION</span>
          <h2 class="display-md">Settings & Availability</h2>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Work & Study Capacity Config -->
        <div class="card settings-card">
          <span class="eyebrow">AVAILABILITY & WORKLOAD CONSTRAINTS</span>
          <div class="form-row mt-3">
            <div class="form-group flex-1">
              <label class="form-label">Working Hours Start</label>
              <input type="time" [(ngModel)]="workStart" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Working Hours End</label>
              <input type="time" [(ngModel)]="workEnd" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Weekday Study Target (Hours)</label>
              <input type="number" [(ngModel)]="weekdayStudyHours" class="form-input" min="0" max="8" step="0.5" />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Weekend Study Target (Hours)</label>
              <input type="number" [(ngModel)]="weekendStudyHours" class="form-input" min="0" max="12" step="0.5" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Default Task Duration (Minutes)</label>
            <input type="number" [(ngModel)]="defaultTaskDuration" class="form-input" min="5" max="180" step="5" />
          </div>
        </div>

        <!-- Notification & Email Preferences -->
        <div class="card settings-card">
          <span class="eyebrow">REMINDERS & SPRING MAIL SMTP</span>
          <div class="form-group mt-3">
            <label class="form-label">Recipient Notification Email</label>
            <input type="email" [(ngModel)]="userEmail" class="form-input" placeholder="user@domain.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Morning Agenda Email Time</label>
            <input type="time" [(ngModel)]="agendaTime" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Daily Review Prompt Time</label>
            <input type="time" [(ngModel)]="reviewTime" class="form-input" />
          </div>
          <button type="button" class="btn btn-ghost btn-sm mt-2" (click)="testEmail()">
            SEND TEST REMINDER EMAIL
          </button>
        </div>
      </div>

      <div class="save-strip">
        <button type="button" class="btn btn-primary" (click)="saveSettings()">
          SAVE CONFIGURATION
        </button>
      </div>
    </div>
  `,
  styles: [`
    .settings-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
    }
    .toolbar { display: flex; justify-content: space-between; align-items: center; }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-md);
    }
    .settings-card { display: flex; flex-direction: column; gap: 12px; }
    .mt-3 { margin-top: 12px; }
    .mt-2 { margin-top: 8px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .save-strip { display: flex; justify-content: flex-end; margin-top: 20px; }
  `]
})
export class SettingsComponent {
  workStart = '09:00';
  workEnd = '18:00';
  weekdayStudyHours = 2.0;
  weekendStudyHours = 4.0;
  defaultTaskDuration = 45;
  userEmail = 'operator@local.dev';
  agendaTime = '08:00';
  reviewTime = '21:00';

  testEmail() {
    alert('Simulating email reminder test through Spring Mail.');
  }

  saveSettings() {
    alert('Settings saved successfully.');
  }
}
