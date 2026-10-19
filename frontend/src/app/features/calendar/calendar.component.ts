import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-viewport">
      <div class="calendar-header">
        <div>
          <span class="eyebrow">SCHEDULE & SCHEDULING CONSOLE</span>
          <h2 class="display-md">Operational Calendar</h2>
        </div>
        <div class="header-controls font-mono">
          <button type="button" class="btn btn-ghost btn-sm" (click)="prevWeek()">‹ PREV</button>
          <span class="current-range">{{ currentRangeLabel }}</span>
          <button type="button" class="btn btn-ghost btn-sm" (click)="nextWeek()">NEXT ›</button>
          <button type="button" class="btn btn-primary btn-sm">TODAY</button>
        </div>
      </div>

      <!-- Weekly Matrix View -->
      <div class="calendar-grid">
        @for (day of weekDays(); track day.name) {
          <div class="day-column" [class.today]="day.isToday">
            <div class="day-header font-mono">
              <span class="day-name">{{ day.name }}</span>
              <span class="day-number">{{ day.dayNumber }}</span>
            </div>
            <div class="day-events">
              @for (event of day.events; track event.title) {
                <div class="calendar-chip" [class.done]="event.completed">
                  <span class="chip-time font-mono">{{ event.time }}</span>
                  <span class="chip-title">{{ event.title }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
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
      .header-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        .current-range { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
      }
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background-color: var(--border-main);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      overflow: hidden;
      flex: 1;
      min-height: 520px;
    }
    .day-column {
      background-color: var(--bg-card);
      display: flex;
      flex-direction: column;
      &.today {
        background-color: rgba(198, 165, 106, 0.04);
        .day-header { border-bottom: 2px solid var(--accent-gold); color: var(--accent-gold); }
      }
      .day-header {
        padding: 12px;
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.72rem;
        color: var(--text-secondary);
        .day-number { font-weight: 700; font-size: 0.85rem; }
      }
      .day-events {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }
    }
    .calendar-chip {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent-gold);
      border-radius: var(--radius-sm);
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.75rem;
      &.done { opacity: 0.5; text-decoration: line-through; }
      .chip-time { font-size: 0.58rem; color: var(--text-muted); }
      .chip-title { color: var(--text-primary); font-weight: 500; }
    }
  `]
})
export class CalendarComponent {
  currentRangeLabel = 'OCT 19 — OCT 25, 2026';

  weekDays = signal([
    {
      name: 'MON', dayNumber: '19', isToday: true, events: [
        { time: '09:00', title: 'Architecture Planning', completed: true },
        { time: '14:00', title: 'Angular Console Shell', completed: true },
        { time: '19:30', title: 'Spring Data JPA Verification', completed: false }
      ]
    },
    {
      name: 'TUE', dayNumber: '20', isToday: false, events: [
        { time: '10:00', title: 'Task Module CRUD Endpoints', completed: false },
        { time: '18:00', title: 'Study: Java Concurrency', completed: false }
      ]
    },
    {
      name: 'WED', dayNumber: '21', isToday: false, events: [
        { time: '11:00', title: 'Calendar Rescheduling Drag & Drop', completed: false }
      ]
    },
    { name: 'THU', dayNumber: '22', isToday: false, events: [] },
    {
      name: 'FRI', dayNumber: '23', isToday: false, events: [
        { time: '17:00', title: 'Weekly Roadmap Review & Revision', completed: false }
      ]
    },
    { name: 'SAT', dayNumber: '24', isToday: false, events: [] },
    {
      name: 'SUN', dayNumber: '25', isToday: false, events: [
        { time: '20:00', title: 'Weekly Productivity Retrospective', completed: false }
      ]
    }
  ]);

  prevWeek() {}
  nextWeek() {}
}
