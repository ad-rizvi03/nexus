import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService, Habit, HabitSummary, HabitRequest, HabitFrequency } from '../../core/services/habit.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

interface TimelineDay {
  dateStr: string;
  dayLabel: string;
  dayNum: string;
  isToday: boolean;
}

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="habits-viewport">
      <!-- Toolbar Header -->
      <div class="toolbar">
        <div>
          <span class="eyebrow font-mono">CONSISTENCY TELEMETRY & ROUTINES</span>
          <h2 class="display-md">Habits & Consistency Matrix</h2>
        </div>
        <div class="toolbar-actions font-mono">
          <div class="filter-pills">
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'active'"
              (click)="setFilter('active')"
            >
              ACTIVE ({{ activeHabitsCount() }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'all'"
              (click)="setFilter('all')"
            >
              ALL ({{ habits().length }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'paused'"
              (click)="setFilter('paused')"
            >
              PAUSED ({{ pausedHabitsCount() }})
            </button>
          </div>

          <button type="button" class="btn btn-primary btn-sm font-mono" (click)="openAddModal()">
            + NEW HABIT
          </button>
        </div>
      </div>

      <!-- Telemetry Metric Cards -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">ACTIVE ROUTINES</span>
            <span class="metric-icon">⚡</span>
          </div>
          <div class="metric-value font-mono">{{ activeHabitsCount() }}</div>
          <div class="metric-sub font-mono text-muted">{{ pausedHabitsCount() }} paused routines</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">TODAY'S EXECUTION</span>
            <span class="metric-icon">🎯</span>
          </div>
          <div class="metric-value font-mono">
            {{ todayCompletedCount() }} <span class="text-muted text-sm">/ {{ activeHabitsCount() }}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-fill" [style.width.%]="todayProgressPercent()"></div>
          </div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">30-DAY CONSISTENCY</span>
            <span class="metric-icon">📈</span>
          </div>
          <div class="metric-value font-mono text-gold-gradient">{{ overallRate() }}%</div>
          <div class="metric-sub font-mono text-muted">Rolling monthly average</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">LONGEST STREAK</span>
            <span class="metric-icon">🔥</span>
          </div>
          <div class="metric-value font-mono text-gold-gradient">{{ bestStreak() }}d</div>
          <div class="metric-sub font-mono text-muted">Personal record streak</div>
        </div>
      </div>

      <!-- Consistency Matrix Table -->
      <div class="matrix-card card">
        <div class="matrix-table-container">
          <table class="matrix-table">
            <thead>
              <tr class="table-header-row font-mono">
                <th class="col-habit">HABIT ROUTINE</th>
                <th class="col-streak text-center">STREAKS</th>
                <th class="col-rate text-center">30D RATE</th>
                <th class="col-timeline">
                  <div class="timeline-header">
                    <span class="timeline-title">PAST 14 DAYS TIMELINE</span>
                    <div class="timeline-days-row">
                      @for (day of timelineDays(); track day.dateStr) {
                        <div class="day-header-cell" [class.today-cell]="day.isToday">
                          <span class="day-name">{{ day.dayLabel }}</span>
                          <span class="day-num">{{ day.dayNum }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </th>
                <th class="col-actions text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              @if (displayedHabits().length === 0) {
                <tr>
                  <td colspan="5" class="empty-table-cell font-mono text-muted text-center">
                    No habits match the selected filter.
                  </td>
                </tr>
              } @else {
                @for (habit of displayedHabits(); track habit.id) {
                  <tr class="habit-row" [class.paused-row]="habit.isPaused">
                    <!-- Habit Details -->
                    <td class="col-habit">
                      <div class="habit-info">
                        <div class="habit-title-line">
                          <span class="habit-name">{{ habit.name }}</span>
                          <span class="frequency-badge font-mono">{{ habit.targetFrequency }}</span>
                          @if (habit.targetDurationMinutes) {
                            <span class="duration-badge font-mono">⏱ {{ habit.targetDurationMinutes }}m</span>
                          }
                          @if (habit.isPaused) {
                            <span class="paused-badge font-mono">PAUSED</span>
                          }
                        </div>
                        @if (habit.description) {
                          <p class="habit-desc text-muted">{{ habit.description }}</p>
                        }
                      </div>
                    </td>

                    <!-- Streaks -->
                    <td class="col-streak text-center font-mono">
                      <div class="streak-box">
                        <span class="current-streak" [class.active-streak]="habit.currentStreak > 0">
                          🔥 {{ habit.currentStreak }}d
                        </span>
                        <span class="best-streak text-muted">⭐ {{ habit.longestStreak }}d</span>
                      </div>
                    </td>

                    <!-- 30-Day Rate -->
                    <td class="col-rate text-center font-mono">
                      <div class="rate-cell">
                        <span class="rate-number">{{ habit.completionRate30d }}%</span>
                        <div class="mini-progress-bar">
                          <div class="mini-progress-fill" [style.width.%]="habit.completionRate30d"></div>
                        </div>
                      </div>
                    </td>

                    <!-- 14 Days Interactive Cells -->
                    <td class="col-timeline">
                      <div class="timeline-cells-row">
                        @for (day of timelineDays(); track day.dateStr) {
                          <button
                            type="button"
                            class="day-check-btn"
                            [class.done]="habit.recentEntries[day.dateStr]"
                            [class.today]="day.isToday"
                            (click)="toggleDay(habit, day.dateStr)"
                            [title]="day.dateStr + (habit.recentEntries[day.dateStr] ? ': Completed' : ': Incomplete')"
                          >
                            @if (habit.recentEntries[day.dateStr]) {
                              <span class="check-mark">✓</span>
                            }
                          </button>
                        }
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="col-actions text-right font-mono">
                      <div class="actions-group">
                        <button
                          type="button"
                          class="action-btn"
                          (click)="togglePause(habit)"
                          [title]="habit.isPaused ? 'Resume Habit' : 'Pause Habit'"
                        >
                          {{ habit.isPaused ? '▶' : '⏸' }}
                        </button>
                        <button
                          type="button"
                          class="action-btn"
                          (click)="openEditModal(habit)"
                          title="Edit Habit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          class="action-btn danger"
                          (click)="deleteHabit(habit)"
                          title="Delete Habit"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Habit Modal -->
      @if (showModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="font-sans">{{ editingHabitId() ? 'EDIT ROUTINE' : 'NEW HABIT ROUTINE' }}</h3>
              <button type="button" class="close-btn" (click)="closeModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label font-mono">HABIT NAME *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="habitForm.name"
                  placeholder="e.g. Morning System Design Practice"
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">DESCRIPTION & INTENT</label>
                <textarea
                  class="form-textarea"
                  rows="2"
                  [(ngModel)]="habitForm.description"
                  placeholder="e.g. 45 minutes intentional coding or architectural analysis"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">FREQUENCY</label>
                  <select class="form-input font-mono" [(ngModel)]="habitForm.targetFrequency">
                    <option value="DAILY">DAILY (7 Days/Wk)</option>
                    <option value="WEEKDAYS">WEEKDAYS (Mon - Fri)</option>
                    <option value="WEEKENDS">WEEKENDS (Sat - Sun)</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label font-mono">TARGET DURATION (MINUTES)</label>
                  <input
                    type="number"
                    class="form-input font-mono"
                    [(ngModel)]="habitForm.targetDurationMinutes"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer font-mono">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">CANCEL</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!habitForm.name.trim()"
                (click)="saveHabit()"
              >
                SAVE ROUTINE
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .habits-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
      background: var(--bg-base);
      color: var(--text-primary);
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .filter-pills {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .pill-btn {
      background: transparent;
      border: none;
      padding: 6px 12px;
      color: var(--text-muted);
      font-size: 0.7rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { color: var(--text-primary); }
      &.active {
        background: var(--accent-gold);
        color: #000;
        font-weight: 600;
      }
    }

    /* METRICS CARDS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .metric-label {
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .metric-icon {
      font-size: 1rem;
    }
    .metric-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .metric-sub {
      font-size: 0.7rem;
    }
    .progress-bar-container {
      height: 6px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent-gold);
      border-radius: 3px;
      transition: width var(--transition-normal);
    }

    /* MATRIX TABLE */
    .matrix-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0;
      overflow: hidden;
    }
    .matrix-table-container {
      overflow-x: auto;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .table-header-row {
      background: var(--bg-surface-elevated);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      th {
        padding: 14px 18px;
        font-weight: 600;
      }
    }
    .habit-row {
      border-bottom: 1px solid var(--border-subtle);
      transition: background var(--transition-fast);
      &:hover { background: var(--bg-surface-elevated); }
      &:last-child { border-bottom: none; }
      &.paused-row {
        opacity: 0.6;
      }
      td {
        padding: 16px 18px;
        vertical-align: middle;
      }
    }

    .col-habit { min-width: 260px; }
    .col-streak { min-width: 110px; }
    .col-rate { min-width: 110px; }
    .col-timeline { min-width: 440px; }
    .col-actions { min-width: 110px; }

    .habit-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .habit-title-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .habit-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .frequency-badge {
      font-size: 0.62rem;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: rgba(198, 165, 106, 0.12);
      color: var(--accent-gold);
      border: 1px solid rgba(198, 165, 106, 0.3);
    }
    .duration-badge {
      font-size: 0.62rem;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
    }
    .paused-badge {
      font-size: 0.62rem;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: rgba(239, 68, 68, 0.15);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .habit-desc {
      font-size: 0.75rem;
      margin: 0;
      line-height: 1.4;
    }

    .streak-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .current-streak {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-secondary);
      &.active-streak { color: var(--accent-gold); }
    }
    .best-streak {
      font-size: 0.65rem;
    }

    .rate-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }
    .rate-number {
      font-size: 0.82rem;
      font-weight: 600;
    }
    .mini-progress-bar {
      width: 60px;
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 2px;
      overflow: hidden;
    }
    .mini-progress-fill {
      height: 100%;
      background: var(--accent-gold);
    }

    /* TIMELINE */
    .timeline-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .timeline-title {
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    .timeline-days-row, .timeline-cells-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .day-header-cell {
      width: 26px;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 0.6rem;
      line-height: 1.1;
      .day-name { color: var(--text-muted); font-size: 0.55rem; }
      .day-num { color: var(--text-secondary); }
      &.today-cell {
        .day-name, .day-num {
          color: var(--accent-gold);
          font-weight: 700;
        }
      }
    }
    .day-check-btn {
      width: 26px;
      height: 26px;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all var(--transition-fast);
      &:hover {
        border-color: var(--accent-gold);
        background: rgba(198, 165, 106, 0.1);
      }
      &.today {
        border-color: rgba(198, 165, 106, 0.5);
      }
      &.done {
        background: var(--accent-gold);
        border-color: var(--accent-gold);
        box-shadow: 0 0 8px rgba(198, 165, 106, 0.35);
        .check-mark {
          color: #000;
          font-size: 0.8rem;
          font-weight: 900;
        }
      }
    }

    .actions-group {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .action-btn {
      background: transparent;
      border: none;
      font-size: 0.85rem;
      cursor: pointer;
      opacity: 0.65;
      padding: 2px 4px;
      transition: opacity var(--transition-fast);
      &:hover { opacity: 1; }
      &.danger:hover { color: #EF4444; }
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
      width: 480px;
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
    .form-row {
      display: flex;
      gap: 12px;
    }
    .flex-1 { flex: 1; }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
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
export class HabitsComponent implements OnInit {
  private readonly habitService = inject(HabitService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  readonly habits = signal<Habit[]>([]);
  readonly filterMode = signal<'active' | 'all' | 'paused'>('active');

  readonly activeHabitsCount = signal<number>(0);
  readonly pausedHabitsCount = signal<number>(0);
  readonly todayCompletedCount = signal<number>(0);
  readonly overallRate = signal<number>(0);
  readonly bestStreak = signal<number>(0);

  // Modal
  readonly showModal = signal<boolean>(false);
  readonly editingHabitId = signal<string | null>(null);
  habitForm: HabitRequest = {
    name: '',
    description: '',
    targetFrequency: 'DAILY',
    targetDurationMinutes: 30
  };

  // Timeline: last 14 days
  readonly timelineDays = signal<TimelineDay[]>([]);

  readonly displayedHabits = computed(() => {
    const list = this.habits();
    const mode = this.filterMode();
    if (mode === 'active') return list.filter(h => !h.isPaused);
    if (mode === 'paused') return list.filter(h => h.isPaused);
    return list;
  });

  readonly todayProgressPercent = computed(() => {
    const active = this.activeHabitsCount();
    if (active === 0) return 0;
    return Math.min(100, Math.round((this.todayCompletedCount() / active) * 100));
  });

  ngOnInit(): void {
    this.initTimelineDays();
    this.loadHabits();
  }

  initTimelineDays(): void {
    const days: TimelineDay[] = [];
    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayNum}`;

      days.push({
        dateStr,
        dayLabel: dayNames[d.getDay()],
        dayNum: String(d.getDate()),
        isToday: i === 0
      });
    }

    this.timelineDays.set(days);
  }

  loadHabits(): void {
    this.habitService.getHabits(true).subscribe({
      next: (summary) => {
        this.habits.set(summary.habits);
        this.activeHabitsCount.set(summary.totalActiveHabits);
        this.pausedHabitsCount.set(summary.totalPausedHabits);
        this.todayCompletedCount.set(summary.completedTodayCount);
        this.overallRate.set(summary.overallCompletionRate);
        this.bestStreak.set(summary.bestStreakOverall);
      },
      error: (err) => console.error('Failed to load habits', err)
    });
  }

  setFilter(mode: 'active' | 'all' | 'paused'): void {
    this.filterMode.set(mode);
  }

  toggleDay(habit: Habit, dateStr: string): void {
    // Optimistic toggle
    const currentVal = !!habit.recentEntries[dateStr];
    habit.recentEntries[dateStr] = !currentVal;

    this.habitService.toggleEntry(habit.id, { entryDate: dateStr }).subscribe({
      next: (updatedHabit) => {
        this.habits.update(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
        this.recalculateSummary();
      },
      error: (err) => {
        // Revert on error
        habit.recentEntries[dateStr] = currentVal;
        console.error('Failed to toggle habit entry', err);
      }
    });
  }

  togglePause(habit: Habit): void {
    this.habitService.togglePause(habit.id).subscribe({
      next: (updated) => {
        this.habits.update(prev => prev.map(h => h.id === updated.id ? updated : h));
        this.recalculateSummary();
      },
      error: (err) => console.error('Failed to toggle pause', err)
    });
  }

  async deleteHabit(habit: Habit): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE HABIT',
      message: `Permanently delete habit "${habit.name}" and all historical completion tracking?`,
      isDestructive: true,
      confirmText: 'DELETE HABIT'
    });
    if (!ok) return;

    this.habitService.deleteHabit(habit.id).subscribe({
      next: () => {
        this.habits.update(prev => prev.filter(h => h.id !== habit.id));
        this.recalculateSummary();
        this.toastService.success(`Habit "${habit.name}" deleted.`, 'HABIT REMOVED');
      },
      error: (err) => {
        console.error('Failed to delete habit', err);
        this.toastService.error('Failed to delete habit.');
      }
    });
  }

  openAddModal(): void {
    this.editingHabitId.set(null);
    this.habitForm = {
      name: '',
      description: '',
      targetFrequency: 'DAILY',
      targetDurationMinutes: 30
    };
    this.showModal.set(true);
  }

  openEditModal(habit: Habit): void {
    this.editingHabitId.set(habit.id);
    this.habitForm = {
      name: habit.name,
      description: habit.description,
      targetFrequency: habit.targetFrequency,
      targetDurationMinutes: habit.targetDurationMinutes
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveHabit(): void {
    if (!this.habitForm.name.trim()) return;

    const id = this.editingHabitId();
    if (id) {
      this.habitService.updateHabit(id, this.habitForm).subscribe({
        next: (updated) => {
          this.habits.update(prev => prev.map(h => h.id === updated.id ? updated : h));
          this.recalculateSummary();
          this.closeModal();
        },
        error: (err) => console.error('Failed to update habit', err)
      });
    } else {
      this.habitService.createHabit(this.habitForm).subscribe({
        next: (created) => {
          this.habits.update(prev => [created, ...prev]);
          this.recalculateSummary();
          this.closeModal();
        },
        error: (err) => console.error('Failed to create habit', err)
      });
    }
  }

  private recalculateSummary(): void {
    const list = this.habits();
    const active = list.filter(h => !h.isPaused);
    this.activeHabitsCount.set(active.length);
    this.pausedHabitsCount.set(list.length - active.length);

    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = active.filter(h => !!h.recentEntries[todayStr]).length;
    this.todayCompletedCount.set(completedToday);

    const avgRate = list.length === 0 ? 0 :
      Math.round((list.reduce((acc, h) => acc + h.completionRate30d, 0) / list.length) * 10) / 10;
    this.overallRate.set(avgRate);

    const maxStreak = list.reduce((max, h) => Math.max(max, h.longestStreak), 0);
    this.bestStreak.set(maxStreak);
  }
}
