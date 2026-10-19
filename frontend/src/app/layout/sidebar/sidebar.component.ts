import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HealthService } from '../../core/services/health.service';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  hotkey?: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <!-- Brand Header -->
      <div class="brand">
        <div class="logo-mark">
          <svg viewBox="0 0 40 40" width="24" height="24">
            <defs>
              <linearGradient id="brand-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#F4E2B2" />
                <stop offset="50%" stop-color="#E8B86A" />
                <stop offset="100%" stop-color="#C6A56A" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="none" stroke="url(#brand-gold)" stroke-width="1.5" opacity="0.45" />
            <path d="M6 26 A 14 14 0 0 1 34 26" fill="none" stroke="url(#brand-gold)" stroke-width="2.25" stroke-linecap="round" />
            <circle cx="20" cy="20" r="2.6" fill="url(#brand-gold)" />
            <line x1="20" y1="20" x2="30" y2="10" stroke="url(#brand-gold)" stroke-width="1.75" stroke-linecap="round" />
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">ARCLIGHT</span>
          <span class="brand-sub">OPERATIONS</span>
        </div>
      </div>

      <!-- Context Tag -->
      <div class="badge-container">
        <span class="badge badge-gold">FILE · 001 · PRODUCTIVITY</span>
      </div>

      <!-- Authenticated Operator Info -->
      @if (authService.currentUser(); as user) {
        <div class="operator-profile-card">
          <div class="operator-avatar font-mono">
            {{ getInitials(user.displayName) }}
          </div>
          <div class="operator-info">
            <span class="operator-name">{{ user.displayName }}</span>
            <span class="operator-email font-mono">{{ user.email }}</span>
          </div>
          <button type="button" class="btn-logout font-mono" (click)="authService.logout().subscribe()" title="Sign Out">
            ⎋
          </button>
        </div>
      }

      <!-- Navigation Links -->
      <nav class="nav-menu">
        <div class="nav-section-label">COMMAND & WORKSPACE</div>
        @for (item of mainNav; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [title]="item.label"
          >
            <span class="nav-dot"></span>
            <span class="nav-label">{{ item.label }}</span>
            @if (item.hotkey) {
              <span class="nav-hotkey">{{ item.hotkey }}</span>
            }
          </a>
        }

        <div class="nav-section-label mt-section">GROWTH & INSIGHTS</div>
        @for (item of secondaryNav; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [title]="item.label"
          >
            <span class="nav-dot"></span>
            <span class="nav-label">{{ item.label }}</span>
            @if (item.hotkey) {
              <span class="nav-hotkey">{{ item.hotkey }}</span>
            }
          </a>
        }
      </nav>

      <!-- System Health Telemetry Footer -->
      <div class="sidebar-footer">
        <div class="telemetry-box">
          <div class="telemetry-row">
            <span class="telemetry-label">SYSTEM</span>
            <span class="telemetry-val" [class.online]="healthService.isConnected()">
              <span class="pulse-dot"></span>
              {{ healthService.isConnected() ? 'ONLINE' : 'CONNECTING' }}
            </span>
          </div>
          <div class="telemetry-row">
            <span class="telemetry-label">POSTGRES</span>
            <span class="telemetry-val" [class.online]="healthService.isDbConnected()">
              {{ healthService.isDbConnected() ? 'CONNECTED' : 'DISCONNECTED' }}
            </span>
          </div>
          <div class="telemetry-row">
            <span class="telemetry-label">PORT</span>
            <span class="telemetry-val font-mono">8081 / 4201</span>
          </div>
        </div>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly healthService = inject(HealthService);
  readonly authService = inject(AuthService);

  readonly mainNav: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'gauge', hotkey: 'D' },
    { label: 'Tasks', route: '/tasks', icon: 'check-square', hotkey: 'T' },
    { label: 'Calendar', route: '/calendar', icon: 'calendar', hotkey: 'C' },
    { label: 'Notes & Wiki', route: '/notes', icon: 'file-text', hotkey: 'N' },
    { label: 'Learning Roadmap', route: '/learning', icon: 'book-open', hotkey: 'L' },
  ];

  readonly secondaryNav: NavItem[] = [
    { label: 'Habits', route: '/habits', icon: 'repeat', hotkey: 'H' },
    { label: 'Focus Timer', route: '/focus', icon: 'clock', hotkey: 'F' },
    { label: 'Strategic Goals', route: '/goals', icon: 'target', hotkey: 'G' },
    { label: 'Smart Planner', route: '/planner', icon: 'zap', hotkey: 'P' },
    { label: 'Daily Review', route: '/review', icon: 'clipboard-check', hotkey: 'R' },
    { label: 'Analytics', route: '/analytics', icon: 'bar-chart-2', hotkey: 'A' },
    { label: 'Settings & Profile', route: '/settings', icon: 'settings', hotkey: 'S' }
  ];

  getInitials(name: string): string {
    if (!name) return 'OP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
