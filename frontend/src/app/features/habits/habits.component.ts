import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="habits-viewport">
      <div class="toolbar">
        <div>
          <span class="eyebrow">ROUTINES & HABIT TRACKING</span>
          <h2 class="display-md">Consistency Matrix</h2>
        </div>
        <button type="button" class="btn btn-primary btn-sm">+ NEW HABIT</button>
      </div>

      <div class="habits-table card">
        <div class="table-header font-mono">
          <span class="col-name">HABIT ROUTINE</span>
          <span class="col-streak">STREAK</span>
          <span class="col-days">LAST 7 DAYS</span>
        </div>
        @for (habit of habits(); track habit.name) {
          <div class="habit-row">
            <div class="col-name">
              <span class="name">{{ habit.name }}</span>
              <span class="desc text-muted">{{ habit.description }}</span>
            </div>
            <div class="col-streak font-mono">
              <span class="text-gold-gradient font-bold">{{ habit.streak }}d</span>
            </div>
            <div class="col-days">
              @for (day of habit.history; track $index) {
                <span class="day-dot" [class.done]="day" [title]="day ? 'Completed' : 'Missed'"></span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .habits-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
    }
    .toolbar { display: flex; justify-content: space-between; align-items: center; }
    .habits-table {
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      .table-header {
        display: flex;
        padding: 14px 20px;
        background: var(--bg-surface-elevated);
        border-bottom: 1px solid var(--border-subtle);
        font-size: 0.65rem;
        letter-spacing: 0.15em;
        color: var(--text-muted);
      }
      .habit-row {
        display: flex;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-subtle);
        align-items: center;
        &:last-child { border-bottom: none; }
      }
      .col-name { flex: 1; display: flex; flex-direction: column; gap: 2px; .name { font-size: 0.95rem; font-weight: 500; } .desc { font-size: 0.72rem; } }
      .col-streak { width: 100px; font-size: 1rem; }
      .col-days { width: 220px; display: flex; gap: 8px; align-items: center; }
      .day-dot {
        width: 14px;
        height: 14px;
        border-radius: var(--radius-sm);
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-main);
        &.done {
          background: var(--accent-gold);
          border-color: var(--accent-gold);
          box-shadow: 0 0 6px rgba(198, 165, 106, 0.4);
        }
      }
    }
  `]
})
export class HabitsComponent {
  habits = signal([
    { name: 'Morning Code & System Design Practice', description: 'At least 30 minutes of intentional technical problem solving', streak: 12, history: [true, true, true, true, true, true, true] },
    { name: 'Deep Work Focus Session without Distraction', description: 'Minimum 45m continuous study or task execution', streak: 8, history: [true, false, true, true, true, true, true] },
    { name: 'End of Day Review & Carry-forward', description: 'Review finished items and reschedule unfinished work without clutter', streak: 5, history: [false, true, true, true, true, true, false] }
  ]);
}
