import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FocusService, FocusSession, FocusSummary, StartSessionRequest, ManualSessionRequest, SessionType } from '../../core/services/focus.service';
import { TaskService, TaskItem } from '../../core/services/task.service';
import { LearningService, Roadmap } from '../../core/services/learning.service';

interface PresetMode {
  label: string;
  minutes: number;
  type: SessionType;
  isBreak: boolean;
}

@Component({
  selector: 'app-focus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="focus-viewport">
      <div class="focus-layout">
        <!-- Main Timer Column -->
        <div class="focus-main-panel card">
          <div class="panel-header">
            <div>
              <span class="eyebrow font-mono">MISSION FOCUS TELEMETRY</span>
              <h2 class="display-md">Deep Work & Study Session</h2>
            </div>
            <div class="header-actions">
              <button type="button" class="btn btn-secondary btn-sm font-mono" (click)="openManualModal()">
                + LOG OFFLINE TIME
              </button>
            </div>
          </div>

          <!-- Mode Presets Selector -->
          <div class="preset-selector font-mono">
            @for (mode of presets; track mode.label) {
              <button
                type="button"
                class="preset-btn"
                [class.active]="selectedPreset().label === mode.label"
                [disabled]="isRunning()"
                (click)="selectPreset(mode)"
              >
                {{ mode.label }}
              </button>
            }
          </div>

          <!-- Context Linker (Task / Learning Topic) -->
          <div class="context-bar font-mono">
            <div class="context-input-group">
              <span class="context-label">LINK TASK:</span>
              <select
                class="context-select"
                [(ngModel)]="selectedTaskId"
                [disabled]="isRunning()"
              >
                <option [ngValue]="null">None (Standalone Focus)</option>
                @for (task of tasks(); track task.id) {
                  <option [ngValue]="task.id">{{ task.title }}</option>
                }
              </select>
            </div>

            <div class="context-input-group">
              <span class="context-label">OR ROADMAP:</span>
              <select
                class="context-select"
                [(ngModel)]="selectedRoadmapId"
                [disabled]="isRunning()"
              >
                <option [ngValue]="null">None</option>
                @for (rm of roadmaps(); track rm.id) {
                  <option [ngValue]="rm.id">{{ rm.skillName }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Circular SVG Radial Timer Display -->
          <div class="radial-timer-container">
            <svg class="progress-ring" width="280" height="280">
              <circle
                class="progress-ring-bg"
                stroke="rgba(255, 255, 255, 0.05)"
                stroke-width="10"
                fill="transparent"
                r="120"
                cx="140"
                cy="140"
              />
              <circle
                class="progress-ring-circle"
                [style.stroke]="selectedPreset().isBreak ? '#34D399' : 'var(--accent-gold)'"
                stroke-width="10"
                stroke-linecap="round"
                fill="transparent"
                r="120"
                cx="140"
                cy="140"
                [style.strokeDasharray]="circumference"
                [style.strokeDashoffset]="strokeDashoffset()"
              />
            </svg>

            <div class="timer-center-content">
              <div class="time-readout font-mono">{{ formattedTime() }}</div>
              <div
                class="session-status-badge font-mono"
                [class.break]="selectedPreset().isBreak"
                [class.running]="isRunning()"
              >
                {{ statusText() }}
              </div>
              @if (linkedTitle()) {
                <div class="linked-task-pill font-mono">
                  🎯 {{ linkedTitle() }}
                </div>
              }
            </div>
          </div>

          <!-- Controls Bar -->
          <div class="timer-controls font-mono">
            @if (!isRunning() && !isPaused()) {
              <button type="button" class="btn btn-primary btn-lg start-btn" (click)="startSession()">
                ▶ START FOCUS SESSION
              </button>
            } @else {
              <div class="active-controls-group">
                @if (isPaused()) {
                  <button type="button" class="btn btn-primary" (click)="resumeTimer()">
                    ▶ RESUME
                  </button>
                } @else {
                  <button type="button" class="btn btn-secondary" (click)="pauseTimer()">
                    ⏸ PAUSE
                  </button>
                }

                <button type="button" class="btn btn-primary finish-btn" (click)="completeSession()">
                  ✓ COMPLETE & LOG
                </button>

                <button type="button" class="btn btn-danger-ghost" (click)="cancelSession()">
                  ✕ DISCARD
                </button>
              </div>
            }
          </div>

          <!-- Optional Session Notes input -->
          @if (isRunning() || isPaused()) {
            <div class="session-notes-box font-mono">
              <input
                type="text"
                class="session-notes-input"
                [(ngModel)]="sessionNotes"
                placeholder="Add session log notes (e.g., Solved edge cases in Raft replication)..."
              />
            </div>
          }
        </div>

        <!-- Right Side: Telemetry Metrics & Audit History -->
        <div class="focus-side-panel">
          <!-- Metric Badges -->
          <div class="telemetry-stack">
            <div class="stat-card card">
              <span class="stat-label font-mono">TODAY'S SESSIONS</span>
              <div class="stat-num font-mono text-gold-gradient">{{ todayCompletedCount() }}</div>
              <span class="stat-sub font-mono text-muted">Completed focus blocks</span>
            </div>

            <div class="stat-card card">
              <span class="stat-label font-mono">TODAY'S FOCUS DURATION</span>
              <div class="stat-num font-mono">{{ todayFocusMinutes() }}m</div>
              <span class="stat-sub font-mono text-muted">Time logged today</span>
            </div>

            <div class="stat-card card">
              <span class="stat-label font-mono">WEEK-TO-DATE FOCUS</span>
              <div class="stat-num font-mono text-gold-gradient">{{ (weekFocusMinutes() / 60) | number:'1.1-1' }}h</div>
              <span class="stat-sub font-mono text-muted">{{ weekFocusMinutes() }} total minutes</span>
            </div>
          </div>

          <!-- Recent Sessions Audit Log Card -->
          <div class="audit-log-card card">
            <div class="audit-header font-mono">
              <span class="audit-title">RECENT FOCUS AUDIT LOG</span>
              <span class="audit-count">{{ recentSessions().length }} Entries</span>
            </div>

            <div class="audit-list">
              @if (recentSessions().length === 0) {
                <div class="empty-audit font-mono text-muted text-center">
                  No logged focus sessions yet.
                </div>
              } @else {
                @for (session of recentSessions(); track session.id) {
                  <div class="audit-item">
                    <div class="audit-item-top">
                      <span class="session-type-badge font-mono" [attr.data-type]="session.sessionType">
                        {{ session.sessionType }}
                      </span>
                      <span class="audit-duration font-mono">{{ session.durationMinutes || 0 }}m</span>
                      <button
                        type="button"
                        class="delete-btn font-mono"
                        (click)="deleteSession(session.id)"
                        title="Delete Session"
                      >
                        ✕
                      </button>
                    </div>

                    <div class="audit-item-title">
                      {{ session.taskTitle || session.learningTopicTitle || 'General Deep Work' }}
                    </div>

                    @if (session.notes) {
                      <div class="audit-item-notes text-muted">{{ session.notes }}</div>
                    }

                    <div class="audit-item-time font-mono text-muted text-xs">
                      {{ formatSessionTime(session.startTime) }}
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Manual Time Log Modal -->
      @if (showManualModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="font-sans">LOG OFFLINE TIME</h3>
              <button type="button" class="close-btn" (click)="closeManualModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label font-mono">LINKED TASK (OPTIONAL)</label>
                <select class="form-input font-mono" [(ngModel)]="manualForm.taskId">
                  <option [ngValue]="null">None</option>
                  @for (task of tasks(); track task.id) {
                    <option [ngValue]="task.id">{{ task.title }}</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">DURATION (MINUTES) *</label>
                  <input
                    type="number"
                    class="form-input font-mono"
                    [(ngModel)]="manualForm.durationMinutes"
                    min="1"
                  />
                </div>

                <div class="form-group flex-1">
                  <label class="form-label font-mono">SESSION TYPE</label>
                  <select class="form-input font-mono" [(ngModel)]="manualForm.sessionType">
                    <option value="POMODORO">POMODORO</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="SHORT_BREAK">SHORT BREAK</option>
                    <option value="LONG_BREAK">LONG BREAK</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">SESSION NOTES</label>
                <textarea
                  class="form-textarea"
                  rows="3"
                  [(ngModel)]="manualForm.notes"
                  placeholder="What was completed during this focus block?"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer font-mono">
              <button type="button" class="btn btn-secondary" (click)="closeManualModal()">CANCEL</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!manualForm.durationMinutes || manualForm.durationMinutes < 1"
                (click)="saveManualEntry()"
              >
                LOG SESSION
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .focus-viewport {
      padding: var(--space-lg);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
      background: var(--bg-base);
      color: var(--text-primary);
    }
    .focus-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* MAIN PANEL */
    .focus-main-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: 32px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .panel-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
    }

    /* PRESETS */
    .preset-selector {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-top: 4px;
    }
    .preset-btn {
      background: transparent;
      border: none;
      padding: 8px 14px;
      color: var(--text-muted);
      font-size: 0.72rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover:not(:disabled) { color: var(--text-primary); }
      &.active {
        background: var(--accent-gold);
        color: #000;
        font-weight: 700;
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    /* CONTEXT BAR */
    .context-bar {
      display: flex;
      gap: 16px;
      width: 100%;
      max-width: 540px;
      justify-content: center;
    }
    .context-input-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }
    .context-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .context-select {
      flex: 1;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      padding: 5px 8px;
      font-size: 0.72rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
      &:disabled { opacity: 0.6; }
    }

    /* RADIAL SVG TIMER */
    .radial-timer-container {
      position: relative;
      width: 280px;
      height: 280px;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .progress-ring {
      position: absolute;
      top: 0;
      left: 0;
      transform: rotate(-90deg);
    }
    .progress-ring-circle {
      transition: stroke-dashoffset 0.5s ease;
    }
    .timer-center-content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 6px;
      z-index: 2;
    }
    .time-readout {
      font-size: 3.6rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -1px;
      line-height: 1;
    }
    .session-status-badge {
      font-size: 0.65rem;
      letter-spacing: 0.15em;
      color: var(--accent-gold);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      background: rgba(198, 165, 106, 0.1);
      border: 1px solid rgba(198, 165, 106, 0.3);
      &.break {
        color: #34D399;
        background: rgba(52, 211, 153, 0.1);
        border-color: rgba(52, 211, 153, 0.3);
      }
      &.running {
        animation: pulse-glow 2s infinite;
      }
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .linked-task-pill {
      font-size: 0.68rem;
      color: var(--text-secondary);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 4px;
    }

    /* CONTROLS */
    .timer-controls {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .start-btn {
      padding: 12px 36px;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }
    .active-controls-group {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .finish-btn {
      background: #10B981;
      border-color: #10B981;
      color: #000;
      font-weight: 700;
      &:hover { background: #059669; }
    }
    .btn-danger-ghost {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #EF4444;
      border-radius: var(--radius-sm);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 0.75rem;
      &:hover { background: rgba(239, 68, 68, 0.1); }
    }

    .session-notes-box {
      width: 100%;
      max-width: 500px;
    }
    .session-notes-input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      color: var(--text-primary);
      font-size: 0.78rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
    }

    /* RIGHT SIDE PANEL */
    .focus-side-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .telemetry-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .stat-num {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .stat-sub { font-size: 0.68rem; }

    /* AUDIT LOG */
    .audit-log-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0;
      display: flex;
      flex-direction: column;
      flex: 1;
      max-height: 440px;
    }
    .audit-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      font-size: 0.68rem;
      color: var(--text-muted);
    }
    .audit-list {
      padding: 12px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .empty-audit {
      padding: 24px 10px;
      font-size: 0.75rem;
    }
    .audit-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .audit-item-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .session-type-badge {
      font-size: 0.6rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      &[data-type="POMODORO"] { background: rgba(198, 165, 106, 0.15); color: var(--accent-gold); }
      &[data-type="MANUAL"] { background: rgba(56, 189, 248, 0.15); color: #38BDF8; }
      &[data-type="SHORT_BREAK"], &[data-type="LONG_BREAK"] { background: rgba(52, 211, 153, 0.15); color: #34D399; }
    }
    .audit-duration {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-left: auto;
    }
    .delete-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0 4px;
      &:hover { color: #EF4444; }
    }
    .audit-item-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .audit-item-notes {
      font-size: 0.72rem;
      line-height: 1.3;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-dialog {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      width: 460px;
      max-width: 90vw;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { margin: 0; font-size: 1.1rem; color: var(--accent-gold); }
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      &:hover { color: var(--text-primary); }
    }
    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.5px; }
    .form-input, .form-textarea {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      padding: 8px 12px;
      font-size: 0.85rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
    }
    .form-textarea { resize: vertical; font-family: inherit; }
    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class FocusComponent implements OnInit, OnDestroy {
  private readonly focusService = inject(FocusService);
  private readonly taskService = inject(TaskService);
  private readonly learningService = inject(LearningService);

  readonly presets: PresetMode[] = [
    { label: '25m FOCUS', minutes: 25, type: 'POMODORO', isBreak: false },
    { label: '50m DEEP STUDY', minutes: 50, type: 'POMODORO', isBreak: false },
    { label: '5m BREAK', minutes: 5, type: 'SHORT_BREAK', isBreak: true },
    { label: '15m LONG BREAK', minutes: 15, type: 'LONG_BREAK', isBreak: true },
    { label: 'OPEN TIMER', minutes: 0, type: 'OPEN_TIMER', isBreak: false }
  ];

  readonly selectedPreset = signal<PresetMode>(this.presets[0]);
  readonly isRunning = signal<boolean>(false);
  readonly isPaused = signal<boolean>(false);
  readonly secondsLeft = signal<number>(25 * 60);
  readonly totalSeconds = signal<number>(25 * 60);

  // Active Session from backend
  readonly currentSession = signal<FocusSession | null>(null);

  // Telemetry metrics
  readonly todayCompletedCount = signal<number>(0);
  readonly todayFocusMinutes = signal<number>(0);
  readonly weekFocusMinutes = signal<number>(0);
  readonly recentSessions = signal<FocusSession[]>([]);

  // Context Linkers
  readonly tasks = signal<TaskItem[]>([]);
  readonly roadmaps = signal<Roadmap[]>([]);
  selectedTaskId: string | null = null;
  selectedRoadmapId: string | null = null;
  sessionNotes: string = '';

  // Manual modal
  readonly showManualModal = signal<boolean>(false);
  manualForm: ManualSessionRequest = {
    taskId: null,
    durationMinutes: 25,
    sessionType: 'POMODORO',
    notes: ''
  };

  readonly circumference = 2 * Math.PI * 120; // ~753.98
  private timerInterval: any = null;

  readonly strokeDashoffset = computed(() => {
    const total = this.totalSeconds();
    if (total === 0) return 0;
    const left = this.secondsLeft();
    const progress = (total - left) / total;
    return this.circumference * (1 - progress);
  });

  readonly formattedTime = computed(() => {
    const totalSecs = this.secondsLeft();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly statusText = computed(() => {
    if (this.isPaused()) return 'SESSION PAUSED';
    if (this.isRunning()) {
      return this.selectedPreset().isBreak ? 'REST & RECHARGE' : 'DEEP FOCUS · ACTIVE';
    }
    return 'READY TO COMMENCE';
  });

  readonly linkedTitle = computed(() => {
    const active = this.currentSession();
    if (active?.taskTitle) return `Task: ${active.taskTitle}`;
    if (active?.learningTopicTitle) return `Topic: ${active.learningTopicTitle}`;

    if (this.selectedTaskId) {
      const t = this.tasks().find(x => x.id === this.selectedTaskId);
      if (t) return `Task: ${t.title}`;
    }
    if (this.selectedRoadmapId) {
      const rm = this.roadmaps().find(x => x.id === this.selectedRoadmapId);
      if (rm) return `Roadmap: ${rm.skillName}`;
    }
    return '';
  });

  ngOnInit(): void {
    this.loadContextData();
    this.loadSummaryAndRecoverSession();
  }

  ngOnDestroy(): void {
    this.clearTimerInterval();
  }

  loadContextData(): void {
    this.taskService.getTasks().subscribe({
      next: (taskList) => this.tasks.set(taskList.filter(t => t.status !== 'COMPLETED')),
      error: (err) => console.error('Failed to load tasks', err)
    });

    this.learningService.getRoadmaps().subscribe({
      next: (list) => this.roadmaps.set(list),
      error: (err) => console.error('Failed to load roadmaps', err)
    });
  }

  loadSummaryAndRecoverSession(): void {
    this.focusService.getSummary().subscribe({
      next: (summary) => {
        this.todayCompletedCount.set(summary.todayCompletedSessions);
        this.todayFocusMinutes.set(summary.todayFocusMinutes);
        this.weekFocusMinutes.set(summary.weekFocusMinutes);
        this.recentSessions.set(summary.recentSessions);

        // Check if a session was actively running in backend (e.g. across reloads)
        if (summary.activeSession) {
          this.recoverRunningSession(summary.activeSession);
        }
      },
      error: (err) => console.error('Failed to load focus summary', err)
    });
  }

  private recoverRunningSession(session: FocusSession): void {
    this.currentSession.set(session);
    this.selectedTaskId = session.taskId;
    this.sessionNotes = session.notes || '';

    // Calculate elapsed time from persisted start time
    const startMs = new Date(session.startTime).getTime();
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));

    // Choose matching preset or default 25m
    const preset = this.presets.find(p => p.type === session.sessionType) || this.presets[0];
    this.selectedPreset.set(preset);

    const targetSecs = preset.minutes * 60;
    this.totalSeconds.set(targetSecs > 0 ? targetSecs : elapsedSecs + 60);

    const remaining = Math.max(0, targetSecs - elapsedSecs);
    this.secondsLeft.set(remaining);

    this.isRunning.set(true);
    this.isPaused.set(false);
    this.runTimerLoop();
  }

  selectPreset(preset: PresetMode): void {
    this.selectedPreset.set(preset);
    const secs = preset.minutes * 60;
    this.totalSeconds.set(secs);
    this.secondsLeft.set(secs);
    this.isRunning.set(false);
    this.isPaused.set(false);
    this.clearTimerInterval();
  }

  startSession(): void {
    const preset = this.selectedPreset();
    const req: StartSessionRequest = {
      taskId: this.selectedTaskId,
      sessionType: preset.type,
      notes: this.sessionNotes
    };

    this.focusService.startSession(req).subscribe({
      next: (session) => {
        this.currentSession.set(session);
        this.isRunning.set(true);
        this.isPaused.set(false);
        this.runTimerLoop();
      },
      error: (err) => console.error('Failed to start session', err)
    });
  }

  pauseTimer(): void {
    this.isPaused.set(true);
    this.clearTimerInterval();
  }

  resumeTimer(): void {
    this.isPaused.set(false);
    this.runTimerLoop();
  }

  completeSession(): void {
    const session = this.currentSession();
    this.clearTimerInterval();

    const elapsedSecs = this.totalSeconds() - this.secondsLeft();
    const durationMinutes = Math.max(1, Math.round(elapsedSecs / 60));

    if (session) {
      this.focusService.stopSession(session.id, {
        durationMinutes,
        notes: this.sessionNotes
      }).subscribe({
        next: () => {
          this.resetTimerUI();
          this.loadSummaryAndRecoverSession();
        },
        error: (err) => console.error('Failed to stop session', err)
      });
    } else {
      this.resetTimerUI();
    }
  }

  cancelSession(): void {
    const session = this.currentSession();
    this.clearTimerInterval();

    if (session) {
      this.focusService.deleteSession(session.id).subscribe({
        next: () => {
          this.resetTimerUI();
          this.loadSummaryAndRecoverSession();
        },
        error: (err) => console.error('Failed to cancel session', err)
      });
    } else {
      this.resetTimerUI();
    }
  }

  private resetTimerUI(): void {
    this.isRunning.set(false);
    this.isPaused.set(false);
    this.currentSession.set(null);
    this.sessionNotes = '';
    const preset = this.selectedPreset();
    const secs = preset.minutes * 60;
    this.totalSeconds.set(secs);
    this.secondsLeft.set(secs);
  }

  private runTimerLoop(): void {
    this.clearTimerInterval();
    this.timerInterval = setInterval(() => {
      if (this.selectedPreset().minutes === 0) {
        // Open stopwatch count-up
        this.secondsLeft.update(s => s + 1);
        this.totalSeconds.update(t => t + 1);
      } else {
        // Countdown
        if (this.secondsLeft() > 0) {
          this.secondsLeft.update(s => s - 1);
        } else {
          // Timer finished
          this.completeSession();
        }
      }
    }, 1000);
  }

  private clearTimerInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ================= MANUAL ENTRY =================

  openManualModal(): void {
    this.manualForm = {
      taskId: this.selectedTaskId,
      durationMinutes: 25,
      sessionType: 'POMODORO',
      notes: ''
    };
    this.showManualModal.set(true);
  }

  closeManualModal(): void {
    this.showManualModal.set(false);
  }

  saveManualEntry(): void {
    if (!this.manualForm.durationMinutes || this.manualForm.durationMinutes < 1) return;

    this.focusService.createManualEntry(this.manualForm).subscribe({
      next: () => {
        this.closeManualModal();
        this.loadSummaryAndRecoverSession();
      },
      error: (err) => console.error('Failed to save manual focus session', err)
    });
  }

  deleteSession(id: string): void {
    if (!confirm('Delete this logged focus session?')) return;
    this.focusService.deleteSession(id).subscribe({
      next: () => this.loadSummaryAndRecoverSession(),
      error: (err) => console.error('Failed to delete session', err)
    });
  }

  formatSessionTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
