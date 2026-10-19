import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-viewport">
      <div class="auth-card">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="logo-mark">
            <svg viewBox="0 0 40 40" width="32" height="32">
              <defs>
                <linearGradient id="auth-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#F4E2B2" />
                  <stop offset="50%" stop-color="#E8B86A" />
                  <stop offset="100%" stop-color="#C6A56A" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="18" fill="none" stroke="url(#auth-gold)" stroke-width="1.5" opacity="0.45" />
              <path d="M6 26 A 14 14 0 0 1 34 26" fill="none" stroke="url(#auth-gold)" stroke-width="2.25" stroke-linecap="round" />
              <circle cx="20" cy="20" r="2.6" fill="url(#auth-gold)" />
              <line x1="20" y1="20" x2="30" y2="10" stroke="url(#auth-gold)" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </div>
          <span class="eyebrow">ARCLIGHT OPERATIONS CONSOLE</span>
          <h1 class="auth-title font-serif">{{ isRegisterMode() ? 'Create Operator Account' : 'Operator Access' }}</h1>
          <p class="auth-subtitle font-sans text-secondary text-sm">
            {{ isRegisterMode() ? 'Register your private local workspace.' : 'Authenticate your personal session.' }}
          </p>
        </div>

        <!-- Active Session Detected Banner -->
        @if (authService.isAuthenticated()) {
          <div class="active-session-banner font-mono">
            <div class="session-info">
              <span class="session-dot"></span>
              <span class="session-label">ACTIVE OPERATOR SESSION</span>
            </div>
            <div class="session-details">
              <strong>{{ authService.currentUser()?.displayName }}</strong>
              <span class="session-email">({{ authService.currentUser()?.email }})</span>
            </div>
            <div class="session-actions">
              <button type="button" class="btn btn-primary btn-sm" (click)="goToDashboard()">
                RETURN TO DASHBOARD →
              </button>
              <button type="button" class="btn-logout-link" (click)="signOut()">
                SIGN OUT
              </button>
            </div>
          </div>
        }

        <!-- Mode Toggle Tabs -->
        <div class="tab-strip font-mono">
          <button
            type="button"
            class="tab-btn"
            [class.active]="!isRegisterMode()"
            (click)="setMode(false)"
          >
            SIGN IN
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="isRegisterMode()"
            (click)="setMode(true)"
          >
            CREATE ACCOUNT
          </button>
        </div>

        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="alert-box font-mono">
            <span>⚠ {{ errorMessage() }}</span>
          </div>
        }

        <!-- Form -->
        <form (ngSubmit)="submitForm()" class="auth-form">
          @if (isRegisterMode()) {
            <div class="form-group">
              <label class="form-label font-mono">Operator Display Name</label>
              <input
                type="text"
                [(ngModel)]="displayName"
                name="displayName"
                required
                class="form-input"
                placeholder="e.g. Adnan Rizvi"
              />
            </div>
          }

          <div class="form-group">
            <label class="form-label font-mono">Email Address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="form-input"
              placeholder="operator@local.dev"
            />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label font-mono">Secret Password</label>
              <button
                type="button"
                class="toggle-pwd-btn font-mono"
                (click)="showPassword.update(v => !v)"
              >
                {{ showPassword() ? 'HIDE' : 'SHOW' }}
              </button>
            </div>
            <input
              [type]="showPassword() ? 'text' : 'password'"
              [(ngModel)]="password"
              name="password"
              required
              class="form-input"
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full submit-btn"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <span>AUTHENTICATING...</span>
            } @else {
              <span>{{ isRegisterMode() ? 'INITIALIZE ACCOUNT' : 'ENTER COMMAND CENTER' }} →</span>
            }
          </button>
        </form>

        <!-- Footer Notice -->
        <div class="auth-footer font-mono">
          <span>PORT 8081 / 4201 · HTTP-ONLY SESSION PERSISTENCE</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-viewport {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 20%, rgba(198, 165, 106, 0.08) 0%, var(--bg-main) 70%);
      padding: var(--space-lg);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-xl);
      padding: 36px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    }
    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
      .logo-mark { margin-bottom: 8px; }
      .auth-title { font-size: 1.65rem; color: var(--text-primary); margin-top: 4px; }
      .auth-subtitle { color: var(--text-secondary); }
    }
    .tab-strip {
      display: flex;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-card);
      padding: 3px;
      gap: 4px;
      .tab-btn {
        flex: 1;
        padding: 8px;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.68rem;
        letter-spacing: 0.15em;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        &.active {
          background: var(--bg-surface-elevated);
          color: var(--accent-gold);
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
      }
    }
    .active-session-banner {
      background: rgba(198, 165, 106, 0.08);
      border: 1px solid rgba(198, 165, 106, 0.35);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.72rem;
      .session-info {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--accent-gold);
        font-weight: 600;
        letter-spacing: 0.1em;
        .session-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-gold);
          box-shadow: 0 0 8px var(--accent-gold);
        }
      }
      .session-details {
        color: var(--text-primary);
        .session-email {
          color: var(--text-secondary);
          margin-left: 6px;
        }
      }
      .session-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 4px;
        .btn-logout-link {
          background: none;
          border: none;
          color: var(--status-error);
          cursor: pointer;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-decoration: underline;
        }
      }
    }
    .alert-box {
      background-color: rgba(215, 126, 126, 0.12);
      border: 1px solid rgba(215, 126, 126, 0.4);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      font-size: 0.72rem;
      color: var(--status-error);
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .toggle-pwd-btn {
          background: none;
          border: none;
          color: var(--accent-gold);
          font-size: 0.6rem;
          cursor: pointer;
          letter-spacing: 0.1em;
        }
      }
      .submit-btn {
        margin-top: 8px;
        padding: 12px;
      }
      .w-full { width: 100%; }
    }
    .auth-footer {
      text-align: center;
      font-size: 0.58rem;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isRegisterMode = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  email = 'operator@local.dev';
  password = 'NewSecurePassword456!';
  displayName = '';

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  signOut() {
    this.authService.logout().subscribe();
  }

  setMode(register: boolean) {
    this.isRegisterMode.set(register);
    this.errorMessage.set(null);
    if (register && !this.displayName) {
      this.displayName = 'Operator One';
    }
  }

  submitForm() {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    if (this.isRegisterMode()) {
      this.authService.register({
        email: this.email,
        password: this.password,
        displayName: this.displayName
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed. Check inputs.');
        }
      });
    } else {
      this.authService.login({
        email: this.email,
        password: this.password
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Invalid email or password.');
        }
      });
    }
  }
}
