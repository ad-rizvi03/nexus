import { Component, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <!-- Breadcrumb / Location Indicator -->
      <div class="topbar-left">
        <span class="location-code">LOC · LOCALHOST:4201</span>
        <span class="divider">/</span>
        <span class="context-title">PERSONAL OPERATOR CONSOLE</span>
      </div>

      <!-- Center: Command Palette Trigger -->
      <div class="topbar-center">
        <button type="button" class="command-trigger" (click)="openCommandPalette.emit()">
          <span class="prompt-symbol">›</span>
          <span class="prompt-text">Run a command or search...</span>
          <span class="hotkey">⌘K / Ctrl+K</span>
        </button>
      </div>

      <!-- Right: Telemetry & Actions -->
      <div class="topbar-right">
        <!-- Live Clock -->
        <div class="live-clock font-mono">
          <span class="clock-time">{{ currentTime }}</span>
          <span class="clock-tz">UTC</span>
        </div>

        <!-- Quick Add Action -->
        <button type="button" class="btn btn-primary btn-sm" (click)="quickAdd.emit()">
          <span>+</span>
          <span>QUICK CAPTURE</span>
        </button>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() openCommandPalette = new EventEmitter<void>();
  @Output() quickAdd = new EventEmitter<void>();

  readonly healthService = inject(HealthService);
  currentTime: string = '';
  private timer: any;

  ngOnInit() {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
    this.healthService.checkHealth().subscribe();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentTime = now.toTimeString().split(' ')[0];
  }
}
