import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService, CalendarEvent, RescheduleRequest } from '../../core/services/calendar.service';
import { TaskService, Category, CreateTaskRequest } from '../../core/services/task.service';

type CalendarViewMode = 'MONTH' | 'WEEK' | 'DAY';

interface DayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-viewport">
      <!-- Calendar Header & Operational Toolbar -->
      <div class="calendar-header">
        <div class="header-left">
          <span class="eyebrow">SCHEDULE & SCHEDULING CONSOLE</span>
          <h2 class="display-md">Operational Calendar</h2>
        </div>

        <div class="header-center font-mono">
          <div class="view-switcher">
            <button
              type="button"
              class="view-btn"
              [class.active]="viewMode() === 'MONTH'"
              (click)="setViewMode('MONTH')"
            >
              MONTH
            </button>
            <button
              type="button"
              class="view-btn"
              [class.active]="viewMode() === 'WEEK'"
              (click)="setViewMode('WEEK')"
            >
              WEEK
            </button>
            <button
              type="button"
              class="view-btn"
              [class.active]="viewMode() === 'DAY'"
              (click)="setViewMode('DAY')"
            >
              DAY
            </button>
          </div>

          <div class="nav-controls">
            <button type="button" class="btn btn-ghost btn-sm" (click)="navigatePrev()">‹ PREV</button>
            <span class="current-range">{{ currentRangeLabel() }}</span>
            <button type="button" class="btn btn-ghost btn-sm" (click)="navigateNext()">NEXT ›</button>
            <button type="button" class="btn btn-primary btn-sm" (click)="navigateToday()">TODAY</button>
          </div>
        </div>

        <div class="header-right">
          <button type="button" class="btn btn-gold btn-sm font-mono" (click)="openQuickAdd(todayString)">
            + NEW TASK
          </button>
        </div>
      </div>

      <!-- MONTH VIEW -->
      @if (viewMode() === 'MONTH') {
        <div class="month-calendar-container">
          <!-- Weekday Headers -->
          <div class="weekday-bar font-mono">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>

          <!-- Month Grid Cells -->
          <div class="month-grid">
            @for (day of monthDays(); track day.dateString) {
              <div
                class="month-cell"
                [class.other-month]="!day.isCurrentMonth"
                [class.today]="day.isToday"
                (click)="openQuickAdd(day.dateString)"
              >
                <div class="cell-top font-mono">
                  <span class="day-num">{{ day.dayNumber }}</span>
                  @if (day.events.length > 0) {
                    <span class="event-count">{{ day.events.length }} items</span>
                  }
                </div>

                <div class="cell-events" (click)="$event.stopPropagation()">
                  @for (event of day.events; track event.id + event.type) {
                    <div
                      class="calendar-chip font-mono"
                      [class.done]="event.completed"
                      [class.deadline-chip]="event.isDeadline"
                      [class.revision-chip]="event.type === 'REVISION_SESSION'"
                      [style.border-left-color]="event.categoryColor || 'var(--accent-gold)'"
                      (click)="openEventDetail(event)"
                    >
                      <div class="chip-top">
                        @if (event.startTime) {
                          <span class="chip-time">{{ formatTime(event.startTime) }}</span>
                        }
                        <span class="chip-title">{{ event.title }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- WEEK VIEW -->
      @if (viewMode() === 'WEEK') {
        <div class="week-calendar-container">
          <div class="week-grid">
            @for (day of weekDays(); track day.dateString) {
              <div class="week-day-column" [class.today]="day.isToday">
                <div class="week-day-header font-mono">
                  <span class="day-title">{{ formatWeekdayName(day.date) }}</span>
                  <span class="day-badge">{{ day.dayNumber }}</span>
                </div>

                <div class="week-day-events">
                  @for (event of day.events; track event.id + event.type) {
                    <div
                      class="card card-interactive week-event-card"
                      [class.done]="event.completed"
                      [class.deadline-card]="event.isDeadline"
                      (click)="openEventDetail(event)"
                    >
                      <div class="card-meta font-mono">
                        <span class="event-type-badge">{{ event.type === 'TASK_DEADLINE' ? 'DEADLINE' : (event.type === 'REVISION_SESSION' ? 'REVISION' : 'TASK') }}</span>
                        @if (event.startTime) {
                          <span class="event-time">⏰ {{ formatTime(event.startTime) }}</span>
                        }
                      </div>

                      <h4 class="event-title">{{ event.title }}</h4>

                      <div class="card-bottom font-mono">
                        <span class="event-cat" [style.color]="event.categoryColor || 'var(--accent-gold)'">
                          {{ event.categoryName || 'General' }}
                        </span>
                        @if (event.durationMinutes) {
                          <span>{{ event.durationMinutes }}m</span>
                        }
                      </div>
                    </div>
                  }

                  @if (day.events.length === 0) {
                    <div class="week-empty-slot font-mono" (click)="openQuickAdd(day.dateString)">
                      + SCHEDULE
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- DAY VIEW -->
      @if (viewMode() === 'DAY') {
        <div class="day-view-container">
          <div class="day-banner console-panel">
            <div class="panel-header">
              <span class="panel-tag font-mono">DAILY TIMELINE AGENDA</span>
              <h3 class="panel-heading">{{ currentRangeLabel() }}</h3>
            </div>

            <div class="day-events-list">
              @for (event of dayEvents(); track event.id + event.type) {
                <div
                  class="day-timeline-row"
                  [class.done]="event.completed"
                  [class.deadline-row]="event.isDeadline"
                  (click)="openEventDetail(event)"
                >
                  <div class="row-time font-mono">
                    {{ event.startTime ? formatTime(event.startTime) : 'ALL DAY' }}
                  </div>
                  <div class="row-content">
                    <span class="badge font-mono" [ngClass]="getBadgeClassForEvent(event)">
                      {{ event.type }}
                    </span>
                    <h4 class="row-heading">{{ event.title }}</h4>
                    @if (event.description) {
                      <p class="row-desc">{{ event.description }}</p>
                    }
                  </div>
                  <div class="row-meta font-mono">
                    <span class="category-pill" [style.color]="event.categoryColor || 'var(--accent-gold)'">
                      {{ event.categoryName || 'General' }}
                    </span>
                    @if (event.durationMinutes) {
                      <span>⏱ {{ event.durationMinutes }}m</span>
                    }
                  </div>
                </div>
              }

              @if (dayEvents().length === 0) {
                <div class="empty-day-state font-mono">
                  <span>NO SCHEDULED COMMITMENTS OR DEADLINES FOR THIS DAY.</span>
                  <button type="button" class="btn btn-ghost btn-sm mt-3" (click)="openQuickAdd(selectedDayString())">
                    + SCHEDULE TASK FOR THIS DATE
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Quick Task Create Modal -->
      @if (showQuickAddModal) {
        <div class="modal-backdrop" (click)="showQuickAddModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">SCHEDULE TASK FOR {{ quickAddDate }}</span>
              <button type="button" class="close-btn font-mono" (click)="showQuickAddModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveQuickTask()">
              <div class="form-group">
                <label class="form-label font-mono">TASK TITLE</label>
                <input
                  type="text"
                  [(ngModel)]="taskForm.title"
                  name="taskTitle"
                  required
                  class="form-input"
                  placeholder="e.g. Deep dive into PostgreSQL WAL durability"
                  autofocus
                />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">CATEGORY</label>
                  <select [(ngModel)]="taskForm.categoryId" name="taskCat" class="form-select font-mono">
                    <option value="">(None)</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">PRIORITY</label>
                  <select [(ngModel)]="taskForm.priority" name="taskPri" class="form-select font-mono">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">DURATION (MIN)</label>
                  <input
                    type="number"
                    [(ngModel)]="taskForm.estimatedDurationMinutes"
                    name="taskMin"
                    class="form-input font-mono"
                    min="5"
                    step="5"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">PLANNED DATE</label>
                  <input
                    type="date"
                    [(ngModel)]="taskForm.plannedDate"
                    name="taskPlanned"
                    class="form-input font-mono"
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">START TIME (OPTIONAL)</label>
                  <input
                    type="time"
                    [(ngModel)]="taskForm.startTime"
                    name="taskStart"
                    class="form-input font-mono"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="showQuickAddModal = false">CANCEL</button>
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!taskForm.title.trim()">SCHEDULE TASK</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Event Details & Rescheduling Modal -->
      @if (selectedEvent(); as ev) {
        <div class="modal-backdrop" (click)="selectedEvent.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="badge font-mono" [ngClass]="getBadgeClassForEvent(ev)">
                {{ ev.type }}
              </span>
              <button type="button" class="close-btn font-mono" (click)="selectedEvent.set(null)">✕</button>
            </div>

            <h3 class="event-modal-title">{{ ev.title }}</h3>
            @if (ev.description) {
              <p class="event-modal-desc">{{ ev.description }}</p>
            }

            <div class="event-modal-meta font-mono">
              <div class="meta-row">
                <span class="lbl">DATE:</span>
                <span class="val">{{ ev.date }}</span>
              </div>
              @if (ev.startTime) {
                <div class="meta-row">
                  <span class="lbl">TIME:</span>
                  <span class="val">{{ formatTime(ev.startTime) }}</span>
                </div>
              }
              <div class="meta-row">
                <span class="lbl">CATEGORY:</span>
                <span class="val" [style.color]="ev.categoryColor || 'var(--accent-gold)'">{{ ev.categoryName }}</span>
              </div>
              @if (ev.priority) {
                <div class="meta-row">
                  <span class="lbl">PRIORITY:</span>
                  <span class="val">{{ ev.priority }}</span>
                </div>
              }
            </div>

            <!-- Reschedule Form if Task -->
            @if (ev.type === 'TASK_SCHEDULED') {
              <div class="reschedule-section">
                <span class="eyebrow">QUICK RESCHEDULE</span>
                <div class="form-row mt-2">
                  <div class="form-group flex-1">
                    <label class="form-label font-mono">NEW PLANNED DATE</label>
                    <input type="date" [(ngModel)]="rescheduleDate" class="form-input font-mono" />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label font-mono">START TIME</label>
                    <input type="time" [(ngModel)]="rescheduleTime" class="form-input font-mono" />
                  </div>
                </div>
              </div>
            }

            <div class="modal-actions">
              @if (ev.type === 'TASK_SCHEDULED') {
                <button
                  type="button"
                  class="btn btn-gold btn-sm font-mono"
                  (click)="toggleTaskComplete(ev)"
                >
                  {{ ev.completed ? 'REOPEN TASK' : '✓ MARK COMPLETED' }}
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm font-mono"
                  (click)="submitReschedule(ev)"
                >
                  SAVE RESCHEDULE
                </button>
              }
              <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="selectedEvent.set(null)">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
    }
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      .header-center {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
    }
    .view-switcher {
      display: flex;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-sm);
      overflow: hidden;
      .view-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 6px 12px;
        font-size: 0.65rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        &.active {
          background: var(--accent-gold);
          color: var(--bg-base);
          font-weight: 700;
        }
      }
    }
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      .current-range {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-primary);
        min-width: 170px;
        text-align: center;
      }
    }

    /* MONTH VIEW */
    .month-calendar-container {
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      overflow: hidden;
      min-height: 600px;
    }
    .weekday-bar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: var(--bg-surface-elevated);
      border-bottom: 1px solid var(--border-subtle);
      padding: 10px 0;
      text-align: center;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.1em;
    }
    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: minmax(105px, 1fr);
      gap: 1px;
      background-color: var(--border-subtle);
      flex: 1;
    }
    .month-cell {
      background-color: var(--bg-card);
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      cursor: pointer;
      transition: background var(--transition-fast);
      &:hover { background-color: var(--bg-surface-elevated); }
      &.other-month {
        opacity: 0.4;
        background-color: rgba(11, 13, 16, 0.4);
      }
      &.today {
        background-color: rgba(198, 165, 106, 0.05);
        .cell-top .day-num {
          background: var(--accent-gold);
          color: var(--bg-base);
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
      }
      .cell-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.68rem;
        color: var(--text-secondary);
        .day-num { font-weight: 600; }
        .event-count { font-size: 0.58rem; color: var(--text-muted); }
      }
      .cell-events {
        display: flex;
        flex-direction: column;
        gap: 3px;
        overflow-y: hidden;
      }
    }
    .calendar-chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent-gold);
      border-radius: var(--radius-sm);
      padding: 3px 5px;
      font-size: 0.65rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { background: var(--bg-surface-elevated); }
      &.done {
        opacity: 0.5;
        text-decoration: line-through;
      }
      &.deadline-chip {
        border-left-color: var(--status-error) !important;
        background: rgba(215, 126, 126, 0.06);
      }
      &.revision-chip {
        border-left-color: var(--accent-gold) !important;
      }
      .chip-top {
        display: flex;
        gap: 4px;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .chip-time { font-size: 0.55rem; color: var(--text-muted); flex-shrink: 0; }
      .chip-title {
        color: var(--text-primary);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    /* WEEK VIEW */
    .week-calendar-container {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
      align-items: stretch;
      min-height: 580px;
    }
    .week-day-column {
      background: var(--bg-card);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      &.today {
        border-color: var(--accent-gold);
        .week-day-header {
          background: rgba(198, 165, 106, 0.12);
          color: var(--accent-gold);
        }
      }
      .week-day-header {
        padding: 10px;
        background: var(--bg-surface-elevated);
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.72rem;
        color: var(--text-secondary);
        .day-badge {
          background: var(--bg-base);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
      }
      .week-day-events {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }
      .week-empty-slot {
        height: 100%;
        min-height: 120px;
        border: 1px dashed var(--border-subtle);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 0.65rem;
        cursor: pointer;
        &:hover { border-color: var(--accent-gold); color: var(--accent-gold); }
      }
    }
    .week-event-card {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
      &.done { opacity: 0.5; .event-title { text-decoration: line-through; } }
      &.deadline-card { border-left: 3px solid var(--status-error); }
      .card-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.58rem;
        color: var(--text-muted);
      }
      .event-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
      }
      .card-bottom {
        display: flex;
        justify-content: space-between;
        font-size: 0.62rem;
        color: var(--text-muted);
        border-top: 1px solid var(--border-subtle);
        padding-top: 4px;
      }
    }

    /* DAY VIEW */
    .day-view-container {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .day-banner {
      min-height: 520px;
      display: flex;
      flex-direction: column;
    }
    .day-events-list {
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 10px;
    }
    .day-timeline-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { background: var(--bg-surface-elevated); border-color: var(--border-focus); }
      &.done { opacity: 0.5; .row-heading { text-decoration: line-through; } }
      &.deadline-row { border-left: 4px solid var(--status-error); }
      .row-time {
        font-size: 0.75rem;
        color: var(--accent-gold);
        width: 80px;
        font-weight: 600;
      }
      .row-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
        .row-heading { font-size: 0.95rem; font-weight: 500; color: var(--text-primary); }
        .row-desc { font-size: 0.75rem; color: var(--text-secondary); }
      }
      .row-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        font-size: 0.68rem;
        color: var(--text-muted);
      }
    }
    .empty-day-state {
      padding: 60px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 520px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--accent-gold);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-card);
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
      }
      .event-modal-title { font-size: 1.2rem; font-weight: 600; color: var(--text-primary); }
      .event-modal-desc { font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px; }
      .event-modal-meta {
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-sm);
        padding: 12px;
        margin: 16px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.72rem;
        .meta-row {
          display: flex;
          justify-content: space-between;
          .lbl { color: var(--text-muted); }
          .val { color: var(--text-primary); font-weight: 600; }
        }
      }
      .reschedule-section {
        border-top: 1px solid var(--border-subtle);
        padding-top: 14px;
        margin-top: 12px;
      }
      .form-row { display: flex; gap: 12px; }
      .flex-1 { flex: 1; }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
    }
  `]
})
export class CalendarComponent implements OnInit {
  private readonly calendarService = inject(CalendarService);
  private readonly taskService = inject(TaskService);

  readonly viewMode = signal<CalendarViewMode>('MONTH');
  readonly currentDate = signal<Date>(new Date());
  readonly events = signal<CalendarEvent[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly todayString = new Date().toISOString().substring(0, 10);
  readonly selectedEvent = signal<CalendarEvent | null>(null);

  showQuickAddModal = false;
  quickAddDate = this.todayString;

  rescheduleDate = '';
  rescheduleTime = '';

  taskForm: CreateTaskRequest = {
    title: '',
    categoryId: '',
    priority: 'MEDIUM',
    status: 'TO_DO',
    estimatedDurationMinutes: 45,
    plannedDate: this.todayString,
    startTime: ''
  };

  ngOnInit() {
    this.loadCategories();
    this.loadEvents();
  }

  loadCategories() {
    this.taskService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadEvents() {
    const cur = this.currentDate();
    let start: Date;
    let end: Date;

    if (this.viewMode() === 'MONTH') {
      start = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
      end = new Date(cur.getFullYear(), cur.getMonth() + 2, 0);
    } else if (this.viewMode() === 'WEEK') {
      start = new Date(cur);
      start.setDate(cur.getDate() - 7);
      end = new Date(cur);
      end.setDate(cur.getDate() + 14);
    } else {
      start = new Date(cur);
      start.setDate(cur.getDate() - 1);
      end = new Date(cur);
      end.setDate(cur.getDate() + 1);
    }

    const startStr = start.toISOString().substring(0, 10);
    const endStr = end.toISOString().substring(0, 10);

    this.calendarService.getEvents(startStr, endStr).subscribe({
      next: (evs) => this.events.set(evs),
      error: (err) => console.error('Failed to load calendar events', err)
    });
  }

  setViewMode(mode: CalendarViewMode) {
    this.viewMode.set(mode);
    this.loadEvents();
  }

  navigatePrev() {
    const cur = new Date(this.currentDate());
    if (this.viewMode() === 'MONTH') {
      cur.setMonth(cur.getMonth() - 1);
    } else if (this.viewMode() === 'WEEK') {
      cur.setDate(cur.getDate() - 7);
    } else {
      cur.setDate(cur.getDate() - 1);
    }
    this.currentDate.set(cur);
    this.loadEvents();
  }

  navigateNext() {
    const cur = new Date(this.currentDate());
    if (this.viewMode() === 'MONTH') {
      cur.setMonth(cur.getMonth() + 1);
    } else if (this.viewMode() === 'WEEK') {
      cur.setDate(cur.getDate() + 7);
    } else {
      cur.setDate(cur.getDate() + 1);
    }
    this.currentDate.set(cur);
    this.loadEvents();
  }

  navigateToday() {
    this.currentDate.set(new Date());
    this.loadEvents();
  }

  readonly currentRangeLabel = computed(() => {
    const cur = this.currentDate();
    const mode = this.viewMode();

    if (mode === 'MONTH') {
      return cur.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } else if (mode === 'WEEK') {
      const start = this.getStartOfWeek(cur);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const s = start.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
      const e = end.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      return `${s} — ${e}`;
    } else {
      return cur.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }
  });

  readonly monthDays = computed<DayCell[]>(() => {
    const cur = this.currentDate();
    const year = cur.getFullYear();
    const month = cur.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    // Find Monday on or before first day
    const start = new Date(firstDayOfMonth);
    let dayOfWeek = start.getDay(); // 0 is Sun, 1 is Mon...
    if (dayOfWeek === 0) dayOfWeek = 7;
    start.setDate(start.getDate() - (dayOfWeek - 1));

    const cells: DayCell[] = [];
    const evMap = this.getEventsByDateMap();

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = this.toDateString(d);

      cells.push({
        date: d,
        dateString: dStr,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: dStr === this.todayString,
        events: evMap.get(dStr) || []
      });
    }

    return cells;
  });

  readonly weekDays = computed<DayCell[]>(() => {
    const cur = this.currentDate();
    const start = this.getStartOfWeek(cur);
    const cells: DayCell[] = [];
    const evMap = this.getEventsByDateMap();

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = this.toDateString(d);

      cells.push({
        date: d,
        dateString: dStr,
        dayNumber: d.getDate(),
        isCurrentMonth: true,
        isToday: dStr === this.todayString,
        events: evMap.get(dStr) || []
      });
    }

    return cells;
  });

  readonly selectedDayString = computed(() => this.toDateString(this.currentDate()));

  readonly dayEvents = computed<CalendarEvent[]>(() => {
    const curStr = this.selectedDayString();
    return this.events().filter(e => e.date === curStr);
  });

  private getEventsByDateMap(): Map<string, CalendarEvent[]> {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of this.events()) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }

  private getStartOfWeek(d: Date): Date {
    const start = new Date(d);
    let day = start.getDay();
    if (day === 0) day = 7;
    start.setDate(start.getDate() - (day - 1));
    return start;
  }

  private toDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatWeekdayName(d: Date): string {
    return d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  }

  openQuickAdd(dateStr: string) {
    this.quickAddDate = dateStr;
    this.taskForm = {
      title: '',
      categoryId: this.categories().length > 0 ? this.categories()[0].id : '',
      priority: 'MEDIUM',
      status: 'TO_DO',
      estimatedDurationMinutes: 45,
      plannedDate: dateStr,
      startTime: ''
    };
    this.showQuickAddModal = true;
  }

  saveQuickTask() {
    if (!this.taskForm.title.trim()) return;
    this.taskService.createTask(this.taskForm).subscribe({
      next: () => {
        this.showQuickAddModal = false;
        this.loadEvents();
      },
      error: (err) => console.error('Failed to create task', err)
    });
  }

  openEventDetail(event: CalendarEvent) {
    this.selectedEvent.set(event);
    this.rescheduleDate = event.date;
    this.rescheduleTime = event.startTime ? event.startTime.substring(0, 5) : '';
  }

  toggleTaskComplete(event: CalendarEvent) {
    const nextStatus = event.completed ? 'TO_DO' : 'COMPLETED';
    this.taskService.updateStatus(event.id, nextStatus).subscribe({
      next: () => {
        this.selectedEvent.set(null);
        this.loadEvents();
      },
      error: (err) => console.error('Failed to update status', err)
    });
  }

  submitReschedule(event: CalendarEvent) {
    const req: RescheduleRequest = {
      plannedDate: this.rescheduleDate || undefined,
      startTime: this.rescheduleTime ? this.rescheduleTime + ':00' : undefined
    };
    this.calendarService.rescheduleTask(event.id, req).subscribe({
      next: () => {
        this.selectedEvent.set(null);
        this.loadEvents();
      },
      error: (err) => console.error('Failed to reschedule task', err)
    });
  }

  getBadgeClassForEvent(event: CalendarEvent): string {
    if (event.isDeadline) return 'badge-error';
    if (event.type === 'REVISION_SESSION') return 'badge-gold';
    switch (event.priority) {
      case 'URGENT': return 'badge-error';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-gold';
      default: return 'badge-neutral';
    }
  }
}
