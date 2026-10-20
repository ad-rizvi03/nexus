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
          <svg viewBox="0 0 48 48" width="26" height="26" fill="none">
            <defs>
              <linearGradient id="brand-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F4E2B2" />
                <stop offset="50%" stop-color="#E8B86A" />
                <stop offset="100%" stop-color="#C6A56A" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="42" height="42" rx="10" fill="#14171D" stroke="url(#brand-gold-grad)" stroke-width="2" />
            <path d="M15 33V15L33 33V15" stroke="url(#brand-gold-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name font-sans">NEXUS</span>
          <span class="brand-sub font-mono">WORKSPACE</span>
        </div>
      </div>

      <!-- Context Tag -->
      <div class="badge-container">
        <span class="badge badge-gold font-mono">PERSONAL PRODUCTIVITY OS</span>
      </div>

      <!-- Authenticated User Profile -->
      @if (authService.currentUser(); as user) {
        <div class="user-profile-card">
          <div class="user-avatar font-mono">
            {{ getInitials(user.displayName) }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ user.displayName }}</span>
            <span class="user-email font-mono">{{ user.email }}</span>
          </div>
          <button type="button" class="btn-logout font-mono" (click)="authService.logout().subscribe()" title="Sign Out">
            ⎋
          </button>
        </div>
      }

      <!-- Navigation Links -->
      <nav class="nav-menu">
        <div class="nav-section-label">WORKSPACE MODULES</div>
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
            <span class="telemetry-label">PLATFORM</span>
            <span class="telemetry-val font-mono">v2.4 PRO</span>
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
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
