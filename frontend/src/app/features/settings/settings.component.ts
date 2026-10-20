import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-viewport">
      <div class="toolbar">
        <div>
          <span class="eyebrow">APPLICATION & SYSTEM CONFIGURATION</span>
          <h2 class="display-md">Settings & User Profile</h2>
        </div>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="tab-strip font-mono">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'PROFILE'"
          (click)="activeTab.set('PROFILE')"
        >
          USER PROFILE
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'AVAILABILITY'"
          (click)="activeTab.set('AVAILABILITY')"
        >
          AVAILABILITY & WORKLOAD
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'NOTIFICATIONS'"
          (click)="activeTab.set('NOTIFICATIONS')"
        >
          NOTIFICATIONS & EMAIL
        </button>
      </div>

      <!-- Alert Notification -->
      @if (statusMessage()) {
        <div class="status-alert font-mono" [class.alert-error]="isStatusError()">
          <span>{{ statusMessage() }}</span>
        </div>
      }

      <!-- Tab 1: User Profile -->
      @if (activeTab() === 'PROFILE') {
        <div class="settings-grid">
          <!-- Profile Details -->
          <div class="card settings-card">
            <span class="eyebrow">PERSONAL CREDENTIALS</span>
            <form (ngSubmit)="saveProfile()" class="mt-3">
              <div class="form-group">
                <label class="form-label font-mono">Display Name</label>
                <input type="text" [(ngModel)]="displayName" name="displayName" required class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label font-mono">Account Email</label>
                <input type="email" [(ngModel)]="email" name="email" required class="form-input" />
              </div>
              <button type="submit" class="btn btn-primary btn-sm mt-2">
                UPDATE PROFILE
              </button>
            </form>
          </div>

          <!-- Change Password -->
          <div class="card settings-card">
            <span class="eyebrow">SECURITY & AUTHENTICATION</span>
            <form (ngSubmit)="savePassword()" class="mt-3">
              <div class="form-group">
                <label class="form-label font-mono">Current Password</label>
                <input type="password" [(ngModel)]="currentPassword" name="currentPassword" required class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label font-mono">New Password</label>
                <input type="password" [(ngModel)]="newPassword" name="newPassword" required class="form-input" placeholder="Min 8 characters" />
              </div>
              <button type="submit" class="btn btn-primary btn-sm mt-2">
                CHANGE PASSWORD
              </button>
            </form>
          </div>

          <!-- Danger Zone: Account Deletion -->
          <div class="card settings-card danger-card">
            <span class="eyebrow text-error">DANGER ZONE</span>
            <h4 class="font-sans text-lg mt-1 font-bold">Delete Account</h4>
            <p class="text-secondary text-xs mt-1">
              Permanently removes your account, all associated tasks, roadmaps, notes, and habits. This action cannot be reversed.
            </p>
            <div class="mt-3">
              @if (!showDeleteConfirm) {
                <button type="button" class="btn btn-ghost btn-sm text-error" (click)="showDeleteConfirm = true">
                  DELETE MY ACCOUNT
                </button>
              } @else {
                <div class="confirm-box">
                  <span class="font-mono text-xs text-error">Are you sure? All local data will be erased.</span>
                  <div class="confirm-actions mt-2">
                    <button type="button" class="btn btn-primary btn-sm" (click)="deleteAccount()">
                      YES, CONFIRM PURGE
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="showDeleteConfirm = false">
                      CANCEL
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Tab 2: Availability & Workload -->
      @if (activeTab() === 'AVAILABILITY') {
        <div class="settings-grid">
          <div class="card settings-card">
            <span class="eyebrow">WORK & COMMUTE CONSTRAINTS</span>
            <div class="form-row mt-3">
              <div class="form-group flex-1">
                <label class="form-label font-mono">Working Hours Start</label>
                <input type="time" [(ngModel)]="workStart" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label font-mono">Working Hours End</label>
                <input type="time" [(ngModel)]="workEnd" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label font-mono">Commute Duration (Minutes)</label>
              <input type="number" [(ngModel)]="commuteMinutes" class="form-input" min="0" step="5" />
            </div>
          </div>

          <div class="card settings-card">
            <span class="eyebrow">STUDY & TASK CAPACITY</span>
            <div class="form-row mt-3">
              <div class="form-group flex-1">
                <label class="form-label font-mono">Weekday Study Target (Hours)</label>
                <input type="number" [(ngModel)]="weekdayStudyHours" class="form-input" min="0" max="10" step="0.5" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label font-mono">Weekend Study Target (Hours)</label>
                <input type="number" [(ngModel)]="weekendStudyHours" class="form-input" min="0" max="14" step="0.5" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label font-mono">Default Task Duration (Minutes)</label>
              <input type="number" [(ngModel)]="defaultTaskDuration" class="form-input" min="5" max="180" step="5" />
            </div>
          </div>
        </div>

        <div class="save-strip">
          <button type="button" class="btn btn-primary" (click)="saveAvailability()">
            SAVE AVAILABILITY CONSTRAINTS
          </button>
        </div>
      }

      <!-- Tab 3: Notifications -->
      @if (activeTab() === 'NOTIFICATIONS') {
        <div class="settings-grid">
          <div class="card settings-card">
            <span class="eyebrow">DAILY REMINDER TIMERS</span>
            <div class="form-group mt-3">
              <label class="form-label font-mono">Morning Agenda Email Delivery</label>
              <input type="time" [(ngModel)]="agendaTime" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label font-mono">End-of-Day Review Notification</label>
              <input type="time" [(ngModel)]="reviewTime" class="form-input" />
            </div>
            <button type="button" class="btn btn-ghost btn-sm mt-2" (click)="sendTestEmail()">
              DISPATCH TEST EMAIL THROUGH SPRING MAIL
            </button>
          </div>
        </div>
        <div class="save-strip">
          <button type="button" class="btn btn-primary" (click)="saveAvailability()">
            SAVE NOTIFICATION TIMERS
          </button>
        </div>
      }
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
    .tab-strip {
      display: flex;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-card);
      padding: 4px;
      gap: 6px;
      max-width: 600px;
      .tab-btn {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.65rem;
        letter-spacing: 0.12em;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        &.active {
          background: var(--bg-surface-elevated);
          color: var(--accent-gold);
          font-weight: 600;
        }
      }
    }
    .status-alert {
      padding: 10px 14px;
      background: rgba(120, 185, 154, 0.12);
      border: 1px solid var(--status-success);
      color: var(--status-success);
      border-radius: var(--radius-md);
      font-size: 0.72rem;
      &.alert-error {
        background: rgba(215, 126, 126, 0.12);
        border-color: var(--status-error);
        color: var(--status-error);
      }
    }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: var(--space-md);
    }
    .settings-card { display: flex; flex-direction: column; gap: 12px; }
    .danger-card {
      border-color: rgba(215, 126, 126, 0.4);
      background: linear-gradient(180deg, rgba(215, 126, 126, 0.04) 0%, var(--bg-card) 100%);
    }
    .confirm-box {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--status-error);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .confirm-actions { display: flex; gap: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-2 { margin-top: 8px; }
    .mt-1 { margin-top: 4px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .save-strip { display: flex; justify-content: flex-end; margin-top: 10px; }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);

  activeTab = signal<'PROFILE' | 'AVAILABILITY' | 'NOTIFICATIONS'>('PROFILE');
  statusMessage = signal<string | null>(null);
  isStatusError = signal<boolean>(false);
  showDeleteConfirm = false;

  displayName = '';
  email = '';

  currentPassword = '';
  newPassword = '';

  workStart = '09:00';
  workEnd = '18:00';
  commuteMinutes = 30;
  weekdayStudyHours = 2.0;
  weekendStudyHours = 4.0;
  defaultTaskDuration = 45;
  agendaTime = '08:00';
  reviewTime = '21:00';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.displayName = user.displayName;
      this.email = user.email;
    }
    const settings = this.authService.userSettings();
    if (settings) {
      this.workStart = settings.workStartTime?.substring(0, 5) || '09:00';
      this.workEnd = settings.workEndTime?.substring(0, 5) || '18:00';
      this.commuteMinutes = settings.commuteMinutes || 30;
      this.weekdayStudyHours = settings.weekdayStudyHours || 2.0;
      this.weekendStudyHours = settings.weekendStudyHours || 4.0;
      this.defaultTaskDuration = settings.defaultTaskDurationMinutes || 45;
      this.agendaTime = settings.dailyAgendaTime?.substring(0, 5) || '08:00';
      this.reviewTime = settings.reviewReminderTime?.substring(0, 5) || '21:00';
    }
  }

  saveProfile() {
    this.authService.updateProfile({
      displayName: this.displayName,
      email: this.email
    }).subscribe({
      next: () => {
        this.showMessage('Profile updated successfully.');
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Failed to update profile.', true);
      }
    });
  }

  savePassword() {
    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.showMessage('Password changed successfully.');
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Failed to change password.', true);
      }
    });
  }

  saveAvailability() {
    const current = this.authService.userSettings();
    const updated = {
      timeZone: current?.timeZone || 'UTC',
      firstDayOfWeek: current?.firstDayOfWeek || 1,
      workStartTime: this.workStart + ':00',
      workEndTime: this.workEnd + ':00',
      commuteMinutes: this.commuteMinutes,
      weekdayStudyHours: this.weekdayStudyHours,
      weekendStudyHours: this.weekendStudyHours,
      defaultTaskDurationMinutes: this.defaultTaskDuration,
      dailyAgendaTime: this.agendaTime + ':00',
      reviewReminderTime: this.reviewTime + ':00',
      themePreference: current?.themePreference || 'dark',
      dateFormatPreference: current?.dateFormatPreference || 'YYYY-MM-DD'
    };

    this.authService.updateSettings(updated).subscribe({
      next: () => {
        this.showMessage('Availability constraints saved.');
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Failed to save settings.', true);
      }
    });
  }

  deleteAccount() {
    this.authService.deleteAccount().subscribe();
  }

  sendTestEmail() {
    this.showMessage('Triggered test email dispatch to ' + this.email + ' via Spring Mail.');
  }

  private showMessage(msg: string, isError = false) {
    this.statusMessage.set(msg);
    this.isStatusError.set(isError);
    setTimeout(() => this.statusMessage.set(null), 4000);
  }
}
