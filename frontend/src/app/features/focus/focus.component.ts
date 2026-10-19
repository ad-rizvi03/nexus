import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-focus',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="focus-viewport">
      <div class="focus-panel">
        <span class="eyebrow">MISSION FOCUS TELEMETRY</span>
        <h2 class="display-lg mt-2">Deep Work & Study Session</h2>

        <!-- Timer Circle / Display -->
        <div class="timer-display">
          <div class="time-readout font-mono">{{ formattedTime() }}</div>
          <div class="session-label font-mono">{{ isBreak() ? 'REST & RECHARGE' : 'DEEP FOCUS · ACTIVE' }}</div>
        </div>

        <!-- Controls -->
        <div class="timer-controls">
          @if (!isRunning()) {
            <button type="button" class="btn btn-primary" (click)="startTimer()">
              ▶ START SESSION
            </button>
          } @else {
            <button type="button" class="btn btn-ghost" (click)="pauseTimer()">
              ⏸ PAUSE
            </button>
          }
          <button type="button" class="btn btn-ghost" (click)="resetTimer(25)">
            25m FOCUS
          </button>
          <button type="button" class="btn btn-ghost" (click)="resetTimer(50)">
            50m DEEP STUDY
          </button>
          <button type="button" class="btn btn-ghost" (click)="resetTimer(5, true)">
            5m BREAK
          </button>
        </div>

        <!-- Focus Stats -->
        <div class="focus-stats font-mono">
          <div class="stat-box">
            <span class="num text-gold-gradient">{{ sessionsCompleted() }}</span>
            <span class="lbl">SESSIONS COMPLETED TODAY</span>
          </div>
          <div class="stat-box">
            <span class="num">{{ totalMinutesFocused() }}m</span>
            <span class="lbl">TOTAL FOCUS DURATION</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .focus-viewport {
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100vh - var(--topbar-height));
      padding: var(--space-lg);
    }
    .focus-panel {
      width: 100%;
      max-width: 640px;
      background: var(--bg-card);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-xl);
      padding: 48px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: var(--shadow-card);
    }
    .timer-display {
      margin: 40px 0;
      padding: 30px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      width: 260px;
      height: 260px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle, rgba(198, 165, 106, 0.08) 0%, transparent 70%);
      box-shadow: 0 0 30px rgba(198, 165, 106, 0.1);
      .time-readout {
        font-size: 3.5rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
      }
      .session-label {
        font-size: 0.65rem;
        letter-spacing: 0.15em;
        color: var(--accent-gold);
        margin-top: 10px;
      }
    }
    .timer-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-bottom: 30px;
    }
    .focus-stats {
      display: flex;
      gap: 30px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 24px;
      width: 100%;
      justify-content: center;
      .stat-box {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .num { font-size: 1.5rem; font-weight: 600; }
        .lbl { font-size: 0.6rem; letter-spacing: 0.15em; color: var(--text-muted); }
      }
    }
  `]
})
export class FocusComponent implements OnDestroy {
  timeLeftSeconds = signal(25 * 60);
  isRunning = signal(false);
  isBreak = signal(false);
  sessionsCompleted = signal(3);
  totalMinutesFocused = signal(75);

  private intervalRef: any = null;

  startTimer() {
    this.isRunning.set(true);
    this.intervalRef = setInterval(() => {
      if (this.timeLeftSeconds() > 0) {
        this.timeLeftSeconds.update(s => s - 1);
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning.set(false);
    if (this.intervalRef) clearInterval(this.intervalRef);
  }

  resetTimer(minutes: number, breakMode = false) {
    this.pauseTimer();
    this.isBreak.set(breakMode);
    this.timeLeftSeconds.set(minutes * 60);
  }

  completeSession() {
    this.pauseTimer();
    if (!this.isBreak()) {
      this.sessionsCompleted.update(c => c + 1);
      this.totalMinutesFocused.update(m => m + 25);
      this.resetTimer(5, true);
    } else {
      this.resetTimer(25, false);
    }
  }

  formattedTime(): string {
    const total = this.timeLeftSeconds();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    if (this.intervalRef) clearInterval(this.intervalRef);
  }
}
